// components/AdminEmployeesPage.tsx
"use client";

import React, { useEffect, useState } from "react";
import { DataTable } from "../data-table";
import { columns as baseColumns, Employee } from "../employeColumns";
import Link from "next/link";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/DeleteDialog";

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchEmployees() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/employees");
      if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
      const data: Employee[] = await res.json();
      const normalized = data.map(emp => ({
        ...emp,
        role: (emp.role ?? "EMPLOYEE").toUpperCase(),
      }));
      setEmployees(normalized);
      setFilteredEmployees(normalized);
    } catch (err) {
      setError((err as Error).message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    let filtered = employees;
    if (roleFilter !== "ALL") filtered = filtered.filter(emp => emp.role === roleFilter);
    if (search.trim()) {
      const s = search.toLowerCase();
      filtered = filtered.filter(emp =>
        [emp.name, emp.email, emp.role].some(f => f?.toLowerCase().includes(s))
      );
    }
    setFilteredEmployees(filtered);
  }, [search, employees, roleFilter]);

  const downloadCSV = () => {
    const headers = ["Name", "Email", "Role"];
    const rows = filteredEmployees.map(emp => [emp.name, emp.email, emp.role]);
    const csv = [headers, ...rows].map(r =>
      r.map(c => `"${c?.replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement("a"), { href: url, download: "employees.csv" }).click();
    URL.revokeObjectURL(url);
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error("Update failed");
      fetchEmployees();
      toast.success("Role updated");
    } catch (err) {
      console.error(err);
      toast.error("Error updating role");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/employees/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Deletion failed");
      fetchEmployees();
      toast.success("Employee deleted");
    } catch (err) {
      console.error(err);
      toast.error("Error deleting employee");
    }
  };

  const columns = [
    ...baseColumns.filter(c => c.id !== "role"),
    {
      id: "role",
      header: "Role",
      cell: ({ row }: any) => {
        const emp: Employee = row.original;
        return (
          <Select value={emp.role} onValueChange={val => handleRoleChange(emp.id, val)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }: any) => {
        const emp: Employee = row.original;
        return <DeleteDialog onConfirm={() => handleDelete(emp.id)} />;
      },
    },
  ];

  return (
    <div className="p-6 mx-auto max-w-7xl">
      <div className=" shadow-md rounded-lg p-4 mb-6 flex flex-col md:flex-row md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Employees Management</h1>
          <p className="text-gray-600 text-sm">Browse and manage employees</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search..."
            className="border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 max-w-xs"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-max"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup >
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="EMPLOYEE">Employee</SelectItem>
                <SelectItem value="MEMBER">Member</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button onClick={fetchEmployees}>Refresh</Button>
          <Button onClick={downloadCSV} className="bg-green-600 hover:bg-green-500">
            Download CSV
          </Button>
          <Link
            href="/admin/employees/new"
            className="bg-indigo-600 hover:bg-indigo-500  rounded px-4 py-2"
          >
            Add Employee
          </Link>
        </div>
      </div>

      {loading && <div className="text-center py-20">Loading...</div>}

      {error && (
        <div className="bg-red-100 border-red-400 text-red-700 p-4 rounded max-w-lg mx-auto">
          <strong>Error:</strong> {error}
          <button onClick={fetchEmployees} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredEmployees.length > 0 && (
        <DataTable
          columns={columns}
          data={filteredEmployees}
          rowLinkPrefix="/admin/employees"
        />
      )}

      {!loading && !error && filteredEmployees.length === 0 && (
        <div className="text-center py-20 text-gray-500">No employees found.</div>
      )}
    </div>
  );
}
