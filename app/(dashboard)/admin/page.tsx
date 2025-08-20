// app/(dashboard)/admin/page.tsx
import React from "react";
import prisma from "@/lib/prisma";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  // Fetch base stats + employees with assignedClients
  const [totalClients, totalEmployees, statusCountsRaw, employeesRaw] = await Promise.all([
    prisma.client.count(),
    prisma.user.count({ where: { role: "EMPLOYEE" } }),
    prisma.client.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.user.findMany({
      where: { role: "EMPLOYEE" },
      select: {
        id: true,
        name: true,
        email: true,
        assignedClients: {
          select: {
            id: true,
            status: true,
            totalFeePaid: true,
            totalFee: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  // Serialize employees
  const employees = employeesRaw.map((emp) => ({
    id: emp.id,
    name: emp.name ?? "Unnamed", // Fix: name might be null
    email: emp.email,
    assignedClients: emp.assignedClients.map((c) => ({
      id: c.id,
      status: c.status ?? "UNKNOWN", // Fix: status might be null
      createdAt: c.createdAt.toISOString(),
      feePaid: c.totalFeePaid ?? 0,
      totalFee: c.totalFee ?? 0,
    })),
  }));

  // Transform statusCounts
  const statusCounts = statusCountsRaw.map((s) => ({
    status: s.status ?? "UNKNOWN", // Fix: status might be null
    count: s._count._all,
  }));

  return (
    <AdminDashboardClient
      totalClients={totalClients}
      totalEmployees={totalEmployees}
      statusCounts={statusCounts}
      employees={employees}
    />
  );
}
