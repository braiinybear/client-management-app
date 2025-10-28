import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { auth } from "@clerk/nextjs/server";
import { cleanExcelData } from "@/utils/cleanExcelData";
import pLimit from "p-limit";

export const POST = async (req: Request) => {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the admin user
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    // Get file + employeeId from FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const employeeId = formData.get("employeeId") as string;

    if (!file || !employeeId) {
      return NextResponse.json(
        { message: "Missing file or employeeId" },
        { status: 400 }
      );
    }

    // Make sure employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee || employee.role !== "EMPLOYEE") {
      return NextResponse.json(
        { message: "Invalid employee ID" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const { cleaned, errors } = cleanExcelData(data);

    // ✅ Ensure that any "PROSPECT" status is stored as null before DB upsert
    const sanitized = cleaned.map((client) => ({
      ...client,
      status: client.status === "PROSPECT" ? null : client.status,
    }));

    // Concurrency control
    const limit = pLimit(3);

    const upsertPromises = sanitized.map((client) =>
      limit(() =>
        prisma.client.upsert({
          where: { phone: client.phone },
          update: {
            ...(client.name && { name: client.name }),
            status: client.status, // now null if "PROSPECT"
            notes: client.notes,
            course: client.course,
            hostelFee: client.hostelFee,
            courseFee: client.courseFee,
            totalFee: client.totalFee,
            courseFeePaid: client.courseFeePaid,
            hostelFeePaid: client.hostelFeePaid,
            totalFeePaid: client.totalFeePaid,
            callResponse: client.callResponse,
            assignedEmployeeId: employeeId,
            userId: admin.id, // Admin who uploaded
          },
          create: {
            ...client,
            userId: admin.id, // Admin created the record
            assignedEmployeeId: employeeId,
          },
        })
      )
    );

    const results = await Promise.all(upsertPromises);

    return NextResponse.json(
      {
        message: `${results.length} clients processed successfully`,
        errors,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[ADMIN_CLIENT_BULK_UPLOAD]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
};
