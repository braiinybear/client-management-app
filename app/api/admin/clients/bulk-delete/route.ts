import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Adjust your import path accordingly

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body as { ids: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "Missing or invalid ids array" }, { status: 400 });
    }

    await prisma.client.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({ message: `Deleted ${ids.length} clients.` }, { status: 200 });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
