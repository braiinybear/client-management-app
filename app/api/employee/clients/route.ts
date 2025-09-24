import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma"; // Import Status enum
import { Status } from "@prisma/client";


type DocumentInput = {
  name: string;
  url: string;
};

type ClientInput = {
  name?: string;
  phone?: string;
  status?: Status; // Enum from @prisma/client
  callResponse?: string | null;
  notes?: string | null;
  course?: string | null;
  hostelFee?: number | null;
  courseFee?: number | null;
  totalFee?: number | null;
  courseFeePaid?: number | null;
  hostelFeePaid?: number | null;
  totalFeePaid?: number | null;
  documents?: DocumentInput[];
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clients = await prisma.client.findMany({
      where: { assignedEmployeeId: userId },
      orderBy: { createdAt: "desc" },
      include: { documents: true },
    });

    return NextResponse.json(clients, { status: 200 });
  } catch (error) {
    console.error("[CLIENT_GET]", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body: ClientInput = await req.json();

    // Validate required fields
    if (!body.phone) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

        // Check if a client with the same phone already exists
    const existingClient = await prisma.client.findUnique({
      where: { phone: body.phone },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "A client with this phone number already exists." },
        { status: 409 } // 409 Conflict
      );
    }


    // Find the employee (Clerk user linked to app user)
    const me = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!me) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const clientStatus = body.status ?? Status.PROSPECT;

    const created = await prisma.client.create({
      data: {
        name: body.name ?? "N/A",
        phone: body.phone,
        status: clientStatus,
        callResponse: body.callResponse as any, // optional enum, use as any if not casted properly
        notes: body.notes ?? null,
        course: body.course ?? null,
        hostelFee: body.hostelFee ?? null,
        courseFee: body.courseFee ?? null,
        totalFee: body.totalFee ?? null,
        courseFeePaid: body.courseFeePaid ?? null,
        hostelFeePaid: body.hostelFeePaid ?? null,
        totalFeePaid: body.totalFeePaid ?? null,

        userId: me.id,
        assignedEmployeeId: me.id,

        documents: body.documents && body.documents.length > 0
          ? {
              create: body.documents.map(doc => ({
                name: doc.name,
                url: doc.url,
              })),
            }
          : undefined,
      },
      include: {
        documents: true,
      },
    });

    return NextResponse.json(created, { status: 201 });

  } catch (err) {
    console.error("[CLIENT_POST]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });

  if (!user || user.role !== "EMPLOYEE") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const clientIds: string[] = body.clientIds;

    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return NextResponse.json({ message: "No client IDs provided" }, { status: 400 });
    }

    const deletableClients = await prisma.client.findMany({
      where: {
        id: { in: clientIds },
        assignedEmployeeId: user.id,
      },
      select: { id: true },
    });

    const deletableIds = deletableClients.map((c) => c.id);

    if (deletableIds.length === 0) {
      return NextResponse.json({ message: "No valid clients to delete" }, { status: 404 });
    }

    await prisma.document.deleteMany({
      where: { clientId: { in: deletableIds } },
    });

    await prisma.client.deleteMany({
      where: { id: { in: deletableIds } },
    });

    return NextResponse.json({ message: `${deletableIds.length} client(s) deleted successfully` });
  } catch (err) {
    console.error("[BULK_DELETE_ERROR]", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

