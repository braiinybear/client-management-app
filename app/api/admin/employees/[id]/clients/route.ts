import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server"; // Server-side auth
import { Status } from "@prisma/client";

// Zod schema for validation
const clientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  phone: z.string().min(5, "Phone number is required"),
  status: z.nativeEnum(Status).optional(),
  notes: z.string().optional(),
});

interface RouteParams {
  params: { id: string }; // employee ID
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    // 1️⃣ Authenticate admin user
    const session = await auth(); // async call
    const clerkId = session.userId;

    if (!clerkId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Find admin user in DB
    const adminUser = await prisma.user.findUnique({ where: { clerkId } });
    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 3️⃣ Find employee
    const employeeId = params.id;
    const employee = await prisma.user.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    // 4️⃣ Parse and validate request body
    const body: unknown = await req.json();
    const parsed = clientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.format() },
        { status: 400 }
      );
    }

    // 5️⃣ Check for duplicate phone
    const existing = await prisma.client.findUnique({
      where: { phone: parsed.data.phone },
    });

    if (existing) {
      return NextResponse.json(
        { message: "A client with this phone number already exists" },
        { status: 409 }
      );
    }

    // 6️⃣ Create client assigned to employee
    const created = await prisma.client.create({
      data: {
        name: parsed.data.name,
        phone: parsed.data.phone,
        status: parsed.data.status ?? Status.PROSPECT,
        notes: parsed.data.notes ?? null,
        userId: adminUser.id,           // Admin is creator
        assignedEmployeeId: employee.id, // Employee assignment
      },
    });

    // 7️⃣ Return the created client
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[ADMIN_EMPLOYEE_CREATE_CLIENT]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
