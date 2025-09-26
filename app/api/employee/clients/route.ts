import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { Status, CallResponse } from "@prisma/client";
import { z } from "zod";

const documentSchema = z.object({
  name: z.string(),
  url: z.string().url()
});

const clientInputSchema = z.object({
  name: z.string().optional(),
  phone: z.string(),
  status: z.nativeEnum(Status).optional(),
  callResponse: z.nativeEnum(CallResponse).nullable().optional(),
  notes: z.string().nullable().optional(),
  course: z.string().nullable().optional(),
  hostelFee: z.number().nullable().optional(),
  courseFee: z.number().nullable().optional(),
  totalFee: z.number().nullable().optional(),
  courseFeePaid: z.number().nullable().optional(),
  hostelFeePaid: z.number().nullable().optional(),
  totalFeePaid: z.number().nullable().optional(),
  documents: z.array(documentSchema).optional()
});

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

    const body = await req.json();
    const validationResult = clientInputSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validatedInput = validationResult.data;

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

    const clientStatus = validatedInput.status ?? Status.PROSPECT;

    const created = await prisma.client.create({
      data: {
        name: validatedInput.name ?? "N/A",
        phone: validatedInput.phone,
        status: clientStatus,
        callResponse: validatedInput.callResponse,
        notes: validatedInput.notes ?? null,
        course: validatedInput.course ?? null,
        hostelFee: validatedInput.hostelFee ?? null,
        courseFee: validatedInput.courseFee ?? null,
        totalFee: validatedInput.totalFee ?? null,
        courseFeePaid: validatedInput.courseFeePaid ?? null,
        hostelFeePaid: validatedInput.hostelFeePaid ?? null,
        totalFeePaid: validatedInput.totalFeePaid ?? null,

        userId: me.id,
        assignedEmployeeId: me.id,

        documents: validatedInput.documents && validatedInput.documents.length > 0
          ? {
              create: validatedInput.documents.map((doc: z.infer<typeof documentSchema>) => ({
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
    const deleteSchema = z.object({
      clientIds: z.array(z.string()).min(1)
    });

    const body = await req.json();
    const validationResult = deleteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { clientIds } = validationResult.data;

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

