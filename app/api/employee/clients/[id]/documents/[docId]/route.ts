// app/api/employee/clients/[id]/documents/[docId]/route.ts
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, docId: string }>}
) {
  const employee = await authorizeEmployee();
  if (!employee) {
    return NextResponse.json({ message: "Unauthorized or forbidden" }, { status: 403 });
  }

  const { id: clientId, docId } = await params;

  // Verify client ownership
  const client = await prisma.client.findFirst({
    where: { id: clientId, assignedEmployeeId: employee.id },
  });
  if (!client) {
    return NextResponse.json({ message: "Client not found or not assigned to you" }, { status: 404 });
  }

  // Verify document belongs to client
  const document = await prisma.document.findFirst({
    where: { id: docId, clientId },
  });
  if (!document) {
    return NextResponse.json({ message: "Document not found or does not belong to client" }, { status: 404 });
  }

  try {
    await prisma.document.delete({ where: { id: docId } });
    return NextResponse.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ message: "Failed to delete document" }, { status: 500 });
  }
}
