// app/api/admin/clients/route.ts (Next.js 13+ app router)
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, status: true, phone: true },
  });
  return NextResponse.json(clients);
}
