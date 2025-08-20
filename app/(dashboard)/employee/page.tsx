import React from "react";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import EmployeeDashboardClient from "./EmployeeDashboardClient";

export default async function EmployeeDashboardPage() {
  const { userId } = await auth();
  if (!userId) return null; // or redirect to login

  // Find employee record
  const employee = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!employee) return null;

  // Get date 7 days ago
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Fetch assigned clients (total), recent clients, and status counts
  const [assignedClients, recentClientsRaw, statusCountsRaw] = await Promise.all([
    prisma.client.findMany({
      where: { assignedEmployeeId: employee.id },
      select: { id: true },
    }),
    prisma.client.findMany({
      where: {
        assignedEmployeeId: employee.id,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.groupBy({
      by: ["status"],
      where: { assignedEmployeeId: employee.id },
      _count: { _all: true },
    }),
  ]);

  const statusCounts = statusCountsRaw.map((s) => ({
    status: s.status ?? "Unkown",
    count: s._count._all,
  }));

  return (
    <EmployeeDashboardClient
      totalClients={assignedClients.length} // ✅ Only assigned clients
      recentClients={recentClientsRaw.map((c) => ({
        ...c,
        name:c.name ?? "no name",
        status: c.status ?? "Unkown",
        createdAt: c.createdAt.toISOString(),
      }))} // ✅ Only assigned & last 7 days
      statusCounts={statusCounts}
    />
  );
}
