// app/api/admin/employees/route.ts
import { auth, clerkClient } from "@clerk/nextjs/server"; // ✅ Server version
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user's role from DB
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!currentUser || currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const roleFilter = url.searchParams.get("role");

    const validRoles = ["ADMIN", "EMPLOYEE", "MEMBER"] as const;
    const whereClause =
      roleFilter && validRoles.includes(roleFilter as Role)
        ? { role: roleFilter as Role }
        : {};

    const employees = await prisma.user.findMany({
      where: {
        ...whereClause,
        // Optional: prevent self from appearing
        clerkId: { not: userId },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clerkId: true,
        clients: {
          select: { id: true, name: true, status: true },
        },
        assignedClients: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  const { name, email, role = "EMPLOYEE" } = await req.json();

  // Basic validation
  if (!name || !email) {
    return NextResponse.json(
      { error: "Name and email are required" },
      { status: 400 }
    );
  }

  // Only allow specific roles
  const validRoles = ["ADMIN", "EMPLOYEE", "MEMBER"];
  if (!validRoles.includes(role)) {
    return NextResponse.json(
      { error: "Invalid role" },
      { status: 400 }
    );
  }

  // Check if user with same email already exists in DB
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "User with this email already exists" },
      { status: 409 }
    );
  }

  // Create user in Clerk via Clerk Admin API
  const client = await clerkClient();
  const clerkUser = await client.users.createUser({
    emailAddress: [email],
    firstName: name,
    password: generatePassword(),
  });

  if (!clerkUser || !clerkUser.id) {
    return NextResponse.json(
      { error: "Failed to create user in Clerk" },
      { status: 500 }
    );
  }

  // Create user record in your DB linked with Clerk user ID
  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      role,
      clerkId: clerkUser.id,
    },
  });

  return NextResponse.json(newUser, { status: 201 });
}

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

