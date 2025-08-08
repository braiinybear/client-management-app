'use client';

import Link from "next/link";
import prisma from "@/lib/prisma";
import { StatCard } from "@/components/admin/StatCard";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a0e7e5"];

export default async function AdminDashboardPage() {
  const [totalClients, totalEmployees, statusCounts, employeePerformance] = await Promise.all([
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
        clients: {
          select: { id: true },
        },
      },
    }),
  ]);

  const hasEmployees = employeePerformance.length > 0;
  const hasStatuses = statusCounts.length > 0;

  return (
    <div className="p-4 md:p-6 space-y-10">
      {/* Heading */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Insights into employee performance and client status.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/clients" className="block hover:opacity-90 transition">
          <StatCard title="Total Clients" value={totalClients.toLocaleString()} />
        </Link>

        <Link href="/admin/employees" className="block hover:opacity-90 transition">
          <StatCard title="Total Employees" value={totalEmployees.toLocaleString()} />
        </Link>

        {/* Clients by Status with PieChart or fallback */}
        <StatCard title="Clients by Status" value="">
          {hasStatuses ? (
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusCounts}
                    dataKey="_count._all"
                    nameKey="status"
                    outerRadius={60}
                    fill="#8884d8"
                    label
                  >
                    {statusCounts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No client status data available.</p>
          )}
        </StatCard>
      </div>

      {/* Employee Performance Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Employee Performance</h2>
        </div>

        {hasEmployees ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employeePerformance.map((emp) => (
              <div
                key={emp.id}
                className="border rounded-md p-4 bg-white shadow-sm space-y-1"
              >
                <p className="font-medium">{emp.name}</p>
                <p className="text-sm text-muted-foreground">{emp.email}</p>
                <p className="text-sm mt-1">
                  Clients Handled:{" "}
                  <span className="font-semibold">{emp.clients.length}</span>
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No employees found. Start by adding team members.
          </div>
        )}
      </div>
    </div>
  );
}
