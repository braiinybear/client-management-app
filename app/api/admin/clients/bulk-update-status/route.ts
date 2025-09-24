import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Import enum
import { Status } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, status } = body as { ids: string[]; status: string };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "Missing or invalid ids array" }, { status: 400 });
    }

    if (!status || typeof status !== "string") {
      return NextResponse.json({ message: "Missing or invalid status" }, { status: 400 });
    }

    const upperStatus = status.toUpperCase();

    if (!(upperStatus in Status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    await prisma.client.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: Status[upperStatus as keyof typeof Status],
      },
    });

    return NextResponse.json({ message: `Updated status for ${ids.length} clients.` }, { status: 200 });
  } catch (error) {
    console.error("Bulk update status error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
