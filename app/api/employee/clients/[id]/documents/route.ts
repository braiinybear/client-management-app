import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// Validate user and employee role middleware helper (optional)
async function authorizeEmployee() {
  const { userId } = await auth();
  if (!userId) return null;

  const employee = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!employee || employee.role !== "EMPLOYEE") return null;

  return employee;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const employee = await authorizeEmployee();
  if (!employee) {
    return NextResponse.json({ message: "Unauthorized or forbidden" }, { status: 403 });
  }

  const {id : clientId} = await params;

  // Check if client exists and belongs to this employee
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

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 });
  }

  const { name, url } = body;

  if (typeof name !== "string" || typeof url !== "string") {
    return NextResponse.json(
      { message: "Missing or invalid 'name' or 'url' fields" },
      { status: 400 }
    );
  }

  try {
    const document = await prisma.document.create({
      data: {
        name,
        url,
        clientId,
      },
    });
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json({ message: "Failed to create document" }, { status: 500 });
  }
}

