// app/admin/page.tsx
import React from "react";
import prisma from "@/lib/prisma";
import AdminDashboardClient from "./AdminDashboardClient";

type RawClient = {
  id: string;
  status: string;
  feePaid: number | null;
  totalFee: number | null;
  createdAt: Date;
};

// type RawEmployee = {
//   id: string;
//   name: string;
//   email: string;
//   assignedClients: RawClient[];
// };

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

  // serialize non-serializable values (Date -> ISO)
  const employees = employeesRaw.map((emp) => ({
    id: emp.id,
    name: emp.name,
    email: emp.email,
    assignedClients: emp.assignedClients.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      status: c.status ?? "UNKNOWN", // ensure it's a string
      feePaid: c.totalFeePaid ?? 0,
      totalFee: c.totalFee ?? 0,
    })),
  }));

  // transform statusCounts into simple array { status, count }
  const statusCounts = statusCountsRaw.map((s) => ({
    status: s.status ?? "UNKNOWN", // Convert null to string,
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
