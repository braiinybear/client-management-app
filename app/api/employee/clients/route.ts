import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma"; // Import Status enum
import { Status } from "@prisma/client";


// Document type for POST
type DocumentInput = {
  name: string;
  url: string;
};

// Client creation body type
type ClientInput = {
  name: string;
  email: string;
  phone: string;
  status?: Status; // must match Prisma enum
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

    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Find the employee (app user)
    const me = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!me) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Ensure status is valid enum, default to HOT if undefined
    const clientStatus: Status = body.status ?? Status.PROSPECT;

    // Prepare client data
    const data = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      status: clientStatus,
      course: body.course ?? null,
      hostelFee: body.hostelFee ?? null,
      courseFee: body.courseFee ?? null,
      totalFee: body.totalFee ?? null,
      courseFeePaid: body.courseFeePaid ?? null,
      hostelFeePaid: body.hostelFeePaid ?? null,
      totalFeePaid: body.totalFeePaid ?? null,
      userId: me.id,                 // who created the client
      assignedEmployeeId: me.id,     // assign to this employee
      documents:
        Array.isArray(body.documents) && body.documents.length > 0
          ? { create: body.documents.map((d: DocumentInput) => ({ name: d.name, url: d.url })) }
          : undefined,
    };

    // Create client in DB
    const created = await prisma.client.create({
      data,
      include: { documents: true },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
