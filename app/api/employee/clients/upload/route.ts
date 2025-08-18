import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";
import { auth } from "@clerk/nextjs/server";
import { cleanExcelData } from "@/utils/cleanExcelData";

export const POST = async (req: Request) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!me) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ message: "File not provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    const { cleaned, errors } = cleanExcelData(data);

    // Upsert clients by phone:
    // If phone exists, update fields like name, status, notes etc.
    // If phone doesn't exist, create new client
    const upsertPromises = cleaned.map((client) =>
      prisma.client.upsert({
        where: { phone: client.phone },
        update: {
          // Only update fields if provided (not null or undefined)
          ...(client.name && { name: client.name }),
          status: client.status,
          notes: client.notes,
          course: client.course,
          hostelFee: client.hostelFee,
          courseFee: client.courseFee,
          totalFee: client.totalFee,
          courseFeePaid: client.courseFeePaid,
          hostelFeePaid: client.hostelFeePaid,
          totalFeePaid: client.totalFeePaid,
          callResponse: client.callResponse,
          assignedEmployeeId: me.id,
          userId: me.id,
        },
        create: {
          ...client,
          userId: me.id,
          assignedEmployeeId: me.id,
        },
      })
    );

    const results = await Promise.all(upsertPromises);

    return NextResponse.json(
      {
        message: `${results.length} clients processed`,
        errors,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[CLIENT_BULK_UPLOAD]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
};
