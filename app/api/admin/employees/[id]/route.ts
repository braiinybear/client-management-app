// app/api/admin/employees/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const data = await req.json();

    // Validate role if present
    if (data.role) {
      const validRoles = ["ADMIN", "EMPLOYEE", "MEMBER"];
      if (!validRoles.includes(data.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH Error:", error);
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Find the user in Prisma to get their Clerk ID
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // Delete user in Clerk
    const clerk = await clerkClient();
    clerk.users.deleteUser(user.clerkId);

    // Delete user in your database
    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "Employee deleted" });
  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
