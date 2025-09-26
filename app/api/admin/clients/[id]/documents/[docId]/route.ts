import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; docId: string } }
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

    // Get document
    const document = await prisma.document.findUnique({
      where: { id: params.docId },
      include: { client: true },
    });

    if (!document) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    // Verify document belongs to the correct client
    if (document.client.id !== params.id) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    // Delete document
    await prisma.document.delete({
      where: { id: params.docId },
    });

    return NextResponse.json({ message: "Document deleted" });
  } catch (error) {
    console.error("[DOCUMENT_DELETE_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}