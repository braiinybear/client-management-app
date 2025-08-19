'use client';

import React, { useEffect, useState } from "react";
import { Client } from "../columns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const router = useRouter();

  const fetchClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/clients");
      if (!res.ok) throw new Error(`Failed to fetch clients: ${res.statusText}`);
      const data: Client[] = await res.json();
      setClients(data);
      setFilteredClients(data);
    } catch (err) {
      setError((err as Error).message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Search filter (without email)
  useEffect(() => {
    if (!search.trim()) {
      setFilteredClients(clients);
    } else {
      const lower = search.toLowerCase();
      setFilteredClients(
        clients.filter((c) =>
          [c.name ?? "", c.phone ?? "", c.status ?? ""].some((field) =>
            field.toLowerCase().includes(lower)
          )
        )
      );
    }
    setCurrentPage(1); // Reset page on filter
  }, [search, clients]);

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
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

  const downloadCSV = () => {
    const headers = ["Name", "Phone", "Status"];  // Removed Email
    const rows = filteredClients.map((c) => [
      c.name || "",
      c.phone || "",
      c.status || "",
    ]);

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

  // Pagination
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const MAX_VISIBLE_PAGES = 5;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= MAX_VISIBLE_PAGES) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      const leftSiblingIndex = Math.max(currentPage - 1, 2);
      const rightSiblingIndex = Math.min(currentPage + 1, totalPages - 1);

      if (leftSiblingIndex > 2) {
        pages.push("left-ellipsis");
      }

      for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
        pages.push(i);
      }

      if (rightSiblingIndex < totalPages - 1) {
        pages.push("right-ellipsis");
      }

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="bg-white shadow-sm border rounded-lg p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Clients</h1>
          <p className="text-gray-500 text-sm">Manage and monitor all registered clients</p>
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
            onClick={fetchClients}
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500 transition"
          >
            Refresh
          </button>
          <button
            onClick={downloadCSV}
            className="px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-500 transition"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center py-20 space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.4s]"></div>
          <span className="ml-3 text-gray-500">Loading clients...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-md max-w-lg mx-auto">
          <strong className="font-bold">Error:</strong> {error}
          <button
            onClick={fetchClients}
            className="ml-3 underline text-red-800 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Data Table */}
      {!loading && !error && paginatedClients.length > 0 && (
        <>
          <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((c, idx) => (
                  <tr
                    onClick={() => router.push(`clients/${c.id}`)}
                    key={idx}
                    className="hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-0"
                  >
                    <td className="px-4 py-3">{c.name || "—"}</td>
                    <td className="px-4 py-3">{c.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getStatusColor(c.status)
                        )}
                      >
                        {c.status || "Unknown"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
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
      )}

      {/* Empty */}
      {!loading && !error && filteredClients.length === 0 && (
        <div className="text-center py-20 text-gray-500">No matching clients found.</div>
      )}
    </div>
  );
}
