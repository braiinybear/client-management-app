// app/(dashboard)/admin/page.tsx
import React from "react";
import prisma from "@/lib/prisma";
import AdminDashboardClient from "./AdminDashboardClient";

export default async function AdminDashboardPage() {
  const [totalClients, totalEmployees, statusCountsRaw, callResponseCountsRaw, employeesRaw] =
    await Promise.all([
      prisma.client.count(),
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.client.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.client.groupBy({
        by: ["callResponse"],
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
              callResponse: true,
              totalFeePaid: true,
              totalFee: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

  // Normalize and format data for frontend
  const statusCounts = statusCountsRaw.map((s) => ({
    status: s.status ?? "UNKNOWN",
    count: s._count._all,
  }));

  const totalStatus = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const statusWithPercentages = statusCounts.map((s) => ({
    ...s,
    percentage: totalStatus ? ((s.count / totalStatus) * 100).toFixed(1) : "0.0",
  }));

  const callResponseCounts = callResponseCountsRaw.map((s) => ({
    callResponse: s.callResponse ?? "No Answer",
    count: s._count._all,
  }));

  const totalResponses = callResponseCounts.reduce((sum, s) => sum + s.count, 0);
  const callResponseWithPercentages = callResponseCounts.map((s) => ({
    ...s,
    percentage: totalResponses ? ((s.count / totalResponses) * 100).toFixed(1) : "0.0",
  }));

  const employees = employeesRaw.map((emp) => ({
    id: emp.id,
    name: emp.name ?? "Unnamed",
    email: emp.email,
    assignedClients: emp.assignedClients.map((c) => ({
      id: c.id,
      status: c.status ?? "UNKNOWN",
      callResponse: c.callResponse ?? "UNKNOWN",
      createdAt: c.createdAt.toISOString(),
      feePaid: c.totalFeePaid ?? 0,
      totalFee: c.totalFee ?? 0,
    })),
  }));

  return (
    <AdminDashboardClient
      totalClients={totalClients}
      totalEmployees={totalEmployees}
      statusCounts={statusWithPercentages}
      callResponseCounts={callResponseWithPercentages}
      employees={employees}
    />
  );
}
