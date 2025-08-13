import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";



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
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body.name || !body.email || !body.phone) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Find the employee (app user)
    const me = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!me) return NextResponse.json({ message: "User not found" }, { status: 404 });

    // Prepare client data and **assign to this employee**
  const data: any = {
  name: body.name,
  email: body.email,
  phone: body.phone,
  status: body.status,
  course: body.course ?? null,
  hostelFee: body.hostelFee ?? null,
  courseFee: body.courseFee ?? null,
  totalFee: body.totalFee ?? null,
  courseFeePaid: body.courseFeePaid ?? null,
  hostelFeePaid: body.hostelFeePaid ?? null,
  totalFeePaid: body.totalFeePaid ?? null,
  userId: me.id,                  // who created the client
  assignedEmployeeId: me.id,      // assign to this employee
};


    // Attach pending documents (if any)
    if (Array.isArray(body.documents) && body.documents.length > 0) {
      data.documents = {
        create: body.documents.map((d: any) => ({ name: d.name, url: d.url })),
      };
    }

    // Create client in DB
    const created = await prisma.client.create({
      data,
      include: { documents: true },
    });

    // Return created client (frontend can redirect using created.id)
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ message: err?.message || "Server error" }, { status: 500 });
  }
}