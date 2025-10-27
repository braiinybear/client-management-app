import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { Status, CallResponse } from "@prisma/client";

/**
 * ✅ Zod schema
 * Only `phone` is required; everything else optional.
 */
const clientSchema = z.object({
  phone: z.string().min(5, "Phone number is required"),
  name: z.string().optional(),
  status: z.nativeEnum(Status).optional(),
  callResponse: z.nativeEnum(CallResponse).optional(),
  course: z.string().optional(),
  hostelFee: z.preprocess((val) => val ? parseFloat(val as string) : 0, z.number().nonnegative()).optional(),
  hostelFeePaid: z.preprocess((val) => val ? parseFloat(val as string) : 0, z.number().nonnegative()).optional(),
  courseFee: z.preprocess((val) => val ? parseFloat(val as string) : 0, z.number().nonnegative()).optional(),
  courseFeePaid: z.preprocess((val) => val ? parseFloat(val as string) : 0, z.number().nonnegative()).optional(),
  totalFee: z.preprocess((val) => val ? parseFloat(val as string) : 0, z.number().nonnegative()).optional(),
  totalFeePaid: z.preprocess((val) => val ? parseFloat(val as string) : 0, z.number().nonnegative()).optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/admin/employees/[id]/clients
 * Creates a client for the given employee.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id : employeeId} = await params;

    // 1️⃣ Authenticate admin
    const session = await auth();
    const clerkId = session?.userId;

    if (!clerkId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 2️⃣ Verify admin role
    const adminUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // 3️⃣ Find employee
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true },
    });

    if (!employee) {
      return NextResponse.json({ message: "Employee not found" }, { status: 404 });
    }

    // 4️⃣ Validate input
    const body = await req.json();
    const parsed = clientSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid input",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // 5️⃣ Check for duplicates by phone
    const existing = await prisma.client.findUnique({
      where: { phone: data.phone },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { message: "A client with this phone number already exists" },
        { status: 409 }
      );
    }

    // 6️⃣ Auto-calc totalFee if not provided
    const totalFee = data.totalFee ?? ((data.hostelFee ?? 0) + (data.courseFee ?? 0));
    const totalFeePaid = data.totalFeePaid ?? ((data.hostelFeePaid ?? 0) + (data.courseFeePaid ?? 0));

    // 7️⃣ Create client
    const created = await prisma.client.create({
      data: {
        phone: data.phone,
        name: data.name ?? "",
        status: data.status ?? Status.PROSPECT,
        callResponse: data.callResponse ?? null,
        course: data.course ?? "",
        hostelFee: data.hostelFee ?? 0,
        hostelFeePaid: data.hostelFeePaid ?? 0,
        courseFee: data.courseFee ?? 0,
        courseFeePaid: data.courseFeePaid ?? 0,
        totalFee,
        totalFeePaid,
        notes: data.notes ?? "",
        userId: adminUser.id,
        assignedEmployeeId: employee.id,
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("[ADMIN_EMPLOYEE_CREATE_CLIENT]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
