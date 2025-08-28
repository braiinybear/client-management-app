"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DeleteDialog } from "../DeleteDialog";

export interface Client {
  id: string;
  name: string | null;
  phone: string | null;
  status: string | null;
}

export default function EmployeeClientsTable({ clients: initialClients }: { clients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const lower = search.toLowerCase();
    return clients.filter((c) =>
      [c.name ?? "", c.phone ?? "", c.status ?? ""].some((field) =>
        field.toLowerCase().includes(lower)
      )
    );
  }, [search, clients]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when search changes
  }, [search]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string | null | undefined): string => {
    const safeStatus = status?.toLowerCase() ?? "";
    switch (safeStatus) {
      case "hot":
        return "bg-red-100 text-red-700";
      case "prospect":
        return "bg-yellow-100 text-yellow-700";
      case "followup":
        return "bg-blue-100 text-blue-700";
      case "cold":
        return "bg-gray-200 text-gray-700";
      case "success":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/employee/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Deletion failed");

      toast.success("Client deleted");

      const updatedClients = clients.filter((c) => c.id !== id);
      setClients(updatedClients);

      const newTotalPages = Math.ceil(updatedClients.length / itemsPerPage);
      if (currentPage > newTotalPages) {
        setCurrentPage(newTotalPages || 1);
      }

    } catch (error) {
      console.error(error);
      toast.error("Error deleting client");
    }
  };

  const downloadCSV = () => {
    const headers = ["Name", "Phone", "Status"];
    const rows = filteredClients.map((c) => [c.name || "N/A", c.phone || "N/A", c.status || "N/A"]);
    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "clients.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const MAX_VISIBLE_PAGES = 5;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= MAX_VISIBLE_PAGES) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      const left = Math.max(currentPage - 1, 2);
      const right = Math.min(currentPage + 1, totalPages - 1);

      if (left > 2) pages.push("left-ellipsis");

      for (let i = left; i <= right; i++) {
        pages.push(i);
      }

      if (right < totalPages - 1) pages.push("right-ellipsis");

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow-sm border rounded-lg p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Clients</h1>
          <p className="text-gray-500 text-sm">Assigned clients only</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
          />
          <button
            onClick={downloadCSV}
            className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-500 transition"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Table */}
      {paginatedClients.length > 0 ? (
        <>
          <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/employee/clients/${c.id}`)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-0"
                  >
                    <td className="px-4 py-3">{c.name || "N/A"}</td>
                    <td className="px-4 py-3">{c.phone || "N/A"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(c.status))}>
                        {c.status || "Unknown"}
                      </span>
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-3"
                    >
                      <DeleteDialog onConfirm={() => handleDelete(c.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center mt-6 space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border text-sm bg-white disabled:opacity-50"
            >
              Prev
            </button>

            {getPageNumbers().map((page, idx) => {
              if (page === "left-ellipsis" || page === "right-ellipsis") {
                return (
                  <span key={page + idx} className="px-2 select-none">
                    &hellip;
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(Number(page))}
                  className={`px-3 py-1 rounded border text-sm ${
                    currentPage === page ? "bg-blue-600 text-white" : "bg-white"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border text-sm bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-gray-500">No clients found.</div>
      )}
    </div>
  );
}
