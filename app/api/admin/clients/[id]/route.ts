import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Status } from "@prisma/client";
import { z } from "zod";

const updateClientSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(["HOT", "PROSPECT", "FOLLOWUP", "COLD", "SUCCESS"]).optional(),
  callResponse: z.enum(["HANGUP", "NOTINTERESTED", "WRONG", "NOTRESPONDED", "NOTREACHED", "ONGOING", "COMPLETED"]).optional(),
  notes: z.string().optional(),
  course: z.string().optional(),
  hostelFee: z.number().nullable().optional(),
  courseFee: z.number().nullable().optional(),
  courseFeePaid: z.number().nullable().optional(),
  hostelFeePaid: z.number().nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateClientSchema.parse(body);

    // Update client
    const updatedClient = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.format() },
        { status: 400 }
      );
    }

    console.error("[ADMIN_CLIENT_UPDATE_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}