import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Status } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get employee
    const employee = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!employee || employee.role !== "EMPLOYEE") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { clientIds, status, courseFee, courseFeePaid, hostelFee, hostelFeePaid } = body;

    if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ message: "Missing or invalid client IDs" }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    
    if (status) {
      const upperStatus = status.toUpperCase();
      if (!(upperStatus in Status)) {
        return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
      }
      updateData.status = Status[upperStatus as keyof typeof Status];
    }

    if (courseFee !== undefined && courseFee !== "") {
      updateData.courseFee = Number(courseFee);
    }
    if (courseFeePaid !== undefined && courseFeePaid !== "") {
      updateData.courseFeePaid = Number(courseFeePaid);
    }
    if (hostelFee !== undefined && hostelFee !== "") {
      updateData.hostelFee = Number(hostelFee);
    }
    if (hostelFeePaid !== undefined && hostelFeePaid !== "") {
      updateData.hostelFeePaid = Number(hostelFeePaid);
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No fields to update" }, { status: 400 });
    }

    // Update clients
    const result = await prisma.client.updateMany({
      where: {
        id: { in: clientIds },
        assignedEmployeeId: employee.id, // Only update clients assigned to this employee
      },
      data: updateData,
    });

    return NextResponse.json({
      message: `Updated ${result.count} clients successfully.`,
    });
  } catch (error) {
    console.error("[BULK_UPDATE_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}