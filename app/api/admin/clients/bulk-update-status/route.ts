import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Status } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: z.nativeEnum(Status),
  courseFee: z.string().optional(),
  courseFeePaid: z.string().optional(),
  hostelFee: z.string().optional(),
  hostelFeePaid: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ message: "Invalid request data", errors: result.error.format() }, { status: 400 });
    }

    const { ids, status, courseFee, courseFeePaid, hostelFee, hostelFeePaid } = result.data;

    const updateData: any = { status };

    // Only include fields that have values
    if (courseFee) updateData.courseFee = parseFloat(courseFee);
    if (courseFeePaid) updateData.courseFeePaid = parseFloat(courseFeePaid);
    if (hostelFee) updateData.hostelFee = parseFloat(hostelFee);
    if (hostelFeePaid) updateData.hostelFeePaid = parseFloat(hostelFeePaid);

    // Calculate and update total fees
    if (courseFee || hostelFee) {
      updateData.totalFee = (courseFee ? parseFloat(courseFee) : 0) + (hostelFee ? parseFloat(hostelFee) : 0);
    }

    if (courseFeePaid || hostelFeePaid) {
      updateData.totalFeePaid = (courseFeePaid ? parseFloat(courseFeePaid) : 0) + (hostelFeePaid ? parseFloat(hostelFeePaid) : 0);
    }

    await prisma.client.updateMany({
      where: {
        id: { in: ids },
      },
      data: updateData,
    });

    return NextResponse.json({ message: `Updated ${ids.length} clients.` });
  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
