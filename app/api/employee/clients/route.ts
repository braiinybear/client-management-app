import { NextResponse } from "next/server";
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
    if (!body.name || !body.phone) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Find the employee (Clerk user linked to app user)
    const me = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!me) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const clientStatus = body.status ?? Status.PROSPECT;

    const created = await prisma.client.create({
      data: {
        name: body.name,
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

