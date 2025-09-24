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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>("");
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
      setSelectedIds(new Set());
      setBulkStatus("");
    } catch (err) {
      setError((err as Error).message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFilteredClients(clients);
    } else {
      const lower = search.toLowerCase();
      setFilteredClients(
        clients.filter((c) =>
          [c.name ?? "", c.phone ?? "", c.status ?? "", c.assignedEmployee?.name ?? ""].some((field) =>
            field.toLowerCase().includes(lower)
          )
        )
      );
    }
    setCurrentPage(1); // Reset page on filter
    setSelectedIds(new Set()); // Reset selection on search change
    setBulkStatus("");
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
    const headers = ["Name", "Phone", "Assigned Employee", "Status"];
    const rows = filteredClients.map((c) => [
      c.name || "",
      c.phone || "",
      c?.assignedEmployee?.name || "",
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

  // Returns an array of page numbers and ellipsis placeholders
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= MAX_VISIBLE_PAGES) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
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

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  // Bulk select handlers
const isAllSelected = filteredClients.every((c) => selectedIds.has(c.id));

const toggleSelectAll = () => {
  if (isAllSelected) {
    // Unselect all filtered clients
    const newSelected = new Set(selectedIds);
    filteredClients.forEach((c) => newSelected.delete(c.id));
    setSelectedIds(newSelected);
  } else {
    // Select all filtered clients
    const newSelected = new Set(selectedIds);
    filteredClients.forEach((c) => newSelected.add(c.id));
    setSelectedIds(newSelected);
  }
};

  const toggleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Bulk Delete
  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected clients? This action cannot be undone.`)) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/clients/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (!res.ok) throw new Error("Failed to delete clients");
      await fetchClients();
      setSelectedIds(new Set());
    } catch (err) {
      alert((err as Error).message || "Error deleting clients");
    } finally {
      setLoading(false);
    }
  };

  // Bulk Update Status
  const bulkUpdateStatus = async () => {
    if (selectedIds.size === 0 || !bulkStatus) return;

    try {
      setLoading(true);
      const res = await fetch("/api/admin/clients/bulk-update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), status: bulkStatus }),
      });
      if (!res.ok) throw new Error("Failed to update clients status");
      await fetchClients();
      setSelectedIds(new Set());
      setBulkStatus("");
    } catch (err) {
      alert((err as Error).message || "Error updating status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="shadow-sm border rounded-lg p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition"
          >
            Refresh
          </button>
          <button
            onClick={downloadCSV}
            className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 transition"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Bulk actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap gap-2 items-center border rounded p-3 bg-gray-50">
          <span className="font-medium text-gray-700">
            {selectedIds.size} client{selectedIds.size > 1 ? "s" : ""} selected
          </span>

          <button
            onClick={bulkDelete}
            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-500 transition"
          >
            Delete Selected
          </button>

          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            <option value="">Change Status...</option>
            <option value="hot">Hot</option>
            <option value="prospect">Prospect</option>
            <option value="followup">Followup</option>
            <option value="cold">Cold</option>
            <option value="success">Success</option>
          </select>

          <button
            onClick={bulkUpdateStatus}
            disabled={!bulkStatus}
            className={`px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500 transition disabled:opacity-50`}
          >
            Apply Status
          </button>
        </div>
      )}

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
          <div className="rounded-lg shadow-sm border overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-sm font-medium text-gray-600">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all clients on page"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Assigned Employee</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-600 cursor-pointer transition-colors border-b last:border-0"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelectOne(c.id)}
                        onClick={e => e.stopPropagation()}
                        aria-label={`Select client ${c.name}`}
                      />
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={() => router.push(`clients/${c.id}`)}
                    >
                      {c.name || "N/A"}
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={() => router.push(`clients/${c.id}`)}
                    >
                      {c?.assignedEmployee?.name || "N/A"}
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={() => router.push(`clients/${c.id}`)}
                    >
                      {c.phone || "N/A"}
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={() => router.push(`clients/${c.id}`)}
                    >
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
              className="px-3 py-1 rounded border text-sm disabled:opacity-50"
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
                    currentPage === page ? "bg-blue-600 text-white" : ""
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border text-sm disabled:opacity-50"
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
