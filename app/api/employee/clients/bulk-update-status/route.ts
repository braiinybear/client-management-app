import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Status } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  clientIds: z.array(z.string()).min(1),
  status: z.nativeEnum(Status).optional(),
  courseFee: z.string().optional(),
  courseFeePaid: z.string().optional(),
  hostelFee: z.string().optional(),
  hostelFeePaid: z.string().optional(),
});

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

    // Validate request body
    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid request data", errors: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { clientIds, status, courseFee, courseFeePaid, hostelFee, hostelFeePaid } = validationResult.data;

    // Build update data
    const updateData: Partial<{
      status: Status;
      courseFee: number;
      courseFeePaid: number;
      hostelFee: number;
      hostelFeePaid: number;
    }> = {};
    
    if (status) {
      updateData.status = status;
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
    const updateResult = await prisma.client.updateMany({
      where: {
        id: { in: clientIds },
        assignedEmployeeId: employee.id, // Only update clients assigned to this employee
      },
      data: updateData,
    });

    return NextResponse.json({
      message: `Updated ${updateResult.count} clients successfully.`,
    });
  } catch (error) {
    console.error("[BULK_UPDATE_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}