// app/api/admin/clients/route.ts (Next.js 13+ app router)
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { Status } from "@prisma/client"; // 👈 Import the Prisma types
import { NextRequest } from "next/server";

export async function GET() {
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, status: true, phone: true,
      assignedEmployee:{
        select:{id:true,name:true}
      }
    },
  });
  return NextResponse.json(clients);
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, status } = body as { ids: string[]; status: string };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "Missing or invalid ids array" }, { status: 400 });
    }

    // Validate and cast status to enum
    if (!status || !(status in Status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    const result = await prisma.client.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: status as Status, // ✅ Cast to Prisma enum
      },
    });

    return NextResponse.json(
      {
        message: `Updated status for ${result.count} clients.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Bulk update status error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
