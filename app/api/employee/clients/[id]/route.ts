// app/api/employee/clients/[id]/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const validStatuses = ["HOT", "FOLLOWUP", "COLD", "PROSPECT", "SUCCESS"] as const;

const UpdateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  status: z.enum(validStatuses).optional(),
  course: z.string().optional(),
  hostelFee: z.number().nullable().optional(),
  totalFee: z.number().nullable().optional(),
  courseFee: z.number().nullable().optional(),
  courseFeePaid: z.number().nullable().optional(),
  hostelFeePaid: z.number().nullable().optional(),
  totalFeePaid: z.number().nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }>}
) {
  const {id: clientId} = await params;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const employee = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!employee || employee.role !== "EMPLOYEE") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const parse = UpdateClientSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json(
      { message: "Validation failed", errors: parse.error.flatten() },
      { status: 400 }
    );
  }

  const data = parse.data;

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      assignedEmployeeId: employee.id,
    },
  });

  if (!client) {
    return NextResponse.json(
      { message: "Client not found or not assigned to you" },
      { status: 404 }
    );
  }

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: data, // only the fields provided will be updated
    });

    return NextResponse.json({ message: "Client updated successfully" });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clientId } = await params;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const employee = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!employee || employee.role !== "EMPLOYEE") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      assignedEmployeeId: employee.id,
    },
  });

  if (!client) {
    return NextResponse.json(
      { message: "Client not found or not assigned to you" },
      { status: 404 }
    );
  }

  try {
    // Delete associated documents (adjust the model/table name and field as per your schema)
    await prisma.document.deleteMany({
      where: { clientId: clientId },
    });

    // Then delete the client
    await prisma.client.delete({
      where: { id: clientId },
    });

    return NextResponse.json({ message: "Client and associated documents deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}