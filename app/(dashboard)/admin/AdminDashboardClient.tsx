"use client";

import React, { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { DataTable } from "./data-table";
import { ColumnDef } from "@tanstack/react-table";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "@/components/admin/StatCard";

type ClientItem = {
  id: string;
  status: string;
  feePaid: number;
  totalFee: number;
  createdAt: string;
};

type EmployeeRaw = {
  id: string;
  name: string;
  email: string;
  assignedClients: ClientItem[];
};

type Props = {
  totalClients: number;
  totalEmployees: number;
  statusCounts: { status: string; count: number }[];
  employees: EmployeeRaw[];
};

type EmployeeMetric = {
  id: string;
  name: string;
  email: string;
  totalClients: number;
  convertedClients: number;
  conversionRate: number;
  revenue: number;
  outstanding: number;
  followups: number;
};

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a0e7e5"];

export default function AdminDashboardClient({
  totalClients,
  totalEmployees,
  statusCounts,
  employees,
}: Props) {
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"revenue" | "conversion" | "name">("revenue");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // Memoized date range filter
  const withinRange = useCallback(
    (iso: string) => {
      const d = new Date(iso);
      if (fromDate) {
        const f = new Date(`${fromDate}T00:00:00`);
        if (d < f) return false;
      }
      if (toDate) {
        const t = new Date(`${toDate}T23:59:59`);
        if (d > t) return false;
      }
      return true;
    },
    [fromDate, toDate]
  );

  const computed: EmployeeMetric[] = useMemo(() => {
    const list = employees.map((emp) => {
      const filtered = emp.assignedClients.filter((c) => withinRange(c.createdAt));
      const totalClients = filtered.length;
      const convertedClients = filtered.filter((c) => c.status === "SUCCESS").length;
      const revenue = filtered.reduce((sum, c) => sum + c.feePaid, 0);
      const outstanding = filtered.reduce((sum, c) => sum + (c.totalFee - c.feePaid), 0);
      const followups = filtered.filter((c) => c.status === "FOLLOWUP").length;
      const conversionRate = totalClients ? (convertedClients / totalClients) * 100 : 0;

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        totalClients,
        convertedClients,
        conversionRate,
        revenue,
        outstanding,
        followups,
      };
    });

    const searched = search
      ? list.filter(
          (e) =>
            e.name.toLowerCase().includes(search.toLowerCase()) ||
            e.email.toLowerCase().includes(search.toLowerCase())
        )
      : list;

    const sorted = [...searched].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortBy === "revenue") return (a.revenue - b.revenue) * dir;
      if (sortBy === "conversion") return (a.conversionRate - b.conversionRate) * dir;
      return a.name.localeCompare(b.name) * dir;
    });

    return sorted;
  }, [employees, search, sortBy, sortDir, withinRange]);

  const columns: ColumnDef<EmployeeMetric>[] = [
    {
      accessorKey: "name",
      header: "Employee",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground break-words">
            {row.original.email}
          </div>
        </div>
      ),
    },
    { accessorKey: "totalClients", header: "Total Clients" },
    { accessorKey: "convertedClients", header: "Converted" },
    {
      accessorKey: "conversionRate",
      header: "Conversion %",
      cell: ({ row }) => `${row.original.conversionRate.toFixed(1)}%`,
    },
    {
      accessorKey: "revenue",
      header: "Revenue",
      cell: ({ row }) => `₹${row.original.revenue.toLocaleString()}`,
    },
    {
      accessorKey: "outstanding",
      header: "Outstanding",
      cell: ({ row }) => `₹${row.original.outstanding.toLocaleString()}`,
    },
    { accessorKey: "followups", header: "Follow-ups" },
  ];

  const exportCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Total Clients",
      "Converted",
      "Conversion %",
      "Revenue",
      "Outstanding",
      "Follow-ups",
    ];

    const rows = computed.map((r) => [
      r.name,
      r.email,
      r.totalClients,
      r.convertedClients,
      r.conversionRate.toFixed(1),
      r.revenue,
      r.outstanding,
      r.followups,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Insights into employee performance and client status.
        </p>
      </div>

      {/* Stat Cards + Pie Chart */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/clients" className="block hover:opacity-90 transition">
          <StatCard title="Total Clients" value={totalClients.toLocaleString()} />
        </Link>
        <Link href="/admin/employees" className="block hover:opacity-90 transition">
          <StatCard title="Total Employees" value={totalEmployees.toLocaleString()} />
        </Link>
        <div className="border rounded-md p-3  shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">Clients by Status</div>
          </div>
          {statusCounts.length ? (
            <div className="w-full h-50">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusCounts}
                    dataKey="count"
                    nameKey="status"
                    outerRadius={60}
                    label
                  >
                    {statusCounts.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No status data</div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            aria-label="Search employee"
            placeholder="Search employees by name or email..."
            className="input input-bordered w-full sm:w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="flex gap-2 items-center">
            <label className="text-sm text-muted-foreground">From</label>
            <input
              type="date"
              value={fromDate ?? ""}
              onChange={(e) => setFromDate(e.target.value || null)}
              className="input input-bordered"
            />
            <label className="text-sm text-muted-foreground">To</label>
            <input
              type="date"
              value={toDate ?? ""}
              onChange={(e) => setToDate(e.target.value || null)}
              className="input input-bordered"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <div className="flex gap-2 items-center">
            <label className="text-sm text-muted-foreground">Sort</label>
            <select
              className="input input-bordered"
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "revenue" | "conversion" | "name")
              }
            >
              <option value="revenue">Revenue</option>
              <option value="conversion">Conversion %</option>
              <option value="name">Name</option>
            </select>
            <select
              className="input input-bordered"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </div>
          <button onClick={exportCSV} className="btn btn-outline w-full sm:w-auto">
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <h2 className="text-lg font-semibold mb-2">Employee Performance</h2>
        <DataTable<EmployeeMetric, EmployeeMetric>
          columns={columns}
          data={computed}
          rowLinkPrefix="/admin/employees"
        />
      </div>
    </div>
  );
}
