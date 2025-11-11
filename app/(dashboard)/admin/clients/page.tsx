'use client';

import React, { useEffect, useMemo, useState } from "react";
import { Client } from "../columns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Status } from "@prisma/client";
import BulkEditClientsModal from "@/components/admin/BulkEditClientsModal";

/**
 * AdminClientsPage
 *
 * - Keeps all your original functions and structure.
 * - Adds:
 *    - Date-wise filtering (defaults to start of current month -> today)
 *    - Multi-word AND search across multiple fields:
 *         name, phone, status, assignedEmployee.name, callResponse
 *    - CSV includes callResponse and createdAt
 *    - Date controls in toolbar (with toggle to disable date filtering)
 *    - Extra helpers, legend, keyboard shortcuts for quick filtering
 *
 * Notes:
 * - This file intentionally includes a number of helper components and
 *   comments to make it self-contained and easy to extend.
 * - The search behaviour: tokenizes user input by whitespace, and all tokens
 *   must match somewhere in the combined fields for a client (AND behavior).
 */

/* -------------------------------------------------------------------------- */
/* ------------------------------- Utilities --------------------------------*/
/* -------------------------------------------------------------------------- */

/** Safely convert possible date fields to a Date or null */
function safeParseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

/** Format date as yyyy-mm-dd for date input default values */
function formatDateInput(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get start of current month */
function getStartOfCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/* -------------------------------------------------------------------------- */
/* ---------------------------- Small UI parts -------------------------------*/
/* -------------------------------------------------------------------------- */

function Legend() {
  return (
    <div className="flex gap-3 items-center text-xs text-gray-600">
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-red-100 border" />
        <span>Hot</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-yellow-100 border" />
        <span>Prospect</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-blue-100 border" />
        <span>Followup</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-gray-200 border" />
        <span>Cold</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full bg-green-100 border" />
        <span>Success</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* -------------------------- Main Page Component ----------------------------*/
/* -------------------------------------------------------------------------- */

export default function AdminClientsPage() {
  // -------------------------
  // Original state (unchanged)
  // -------------------------
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const itemsPerPage = 10;

  const router = useRouter();

  // -------------------------
  // New state for date filter
  // -------------------------
  // defaultStart -> first day of current month
  const defaultStart = useMemo(() => getStartOfCurrentMonth(), []);
  const defaultEnd = useMemo(() => new Date(), []);

  const [dateEnabled, setDateEnabled] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<string>(formatDateInput(defaultStart));
  const [endDate, setEndDate] = useState<string>(formatDateInput(defaultEnd));

  // -------------------------
  // Original fetchClients (preserved)
  // -------------------------
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
    } catch (err) {
      setError((err as Error).message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Multi-term AND search + Date filtering logic (replaces older filter)  */
  /* ---------------------------------------------------------------------- */

  /**
   * Rules:
   * - If dateEnabled is true and startDate/endDate exist, filter clients by createdAt / created_at (if present).
   * - Multi-term search: split on whitespace, lower-case tokens.
   * - All tokens must be found somewhere in the client's searchable haystack:
   *     name, phone, status, assignedEmployee?.name, callResponse
   *   A token can be matched partially (includes).
   *
   * This code intentionally preserves your previous "reset page/selection/modal" behavior.
   */
  useEffect(() => {
    // Defensive: wait until clients loaded
    const applyFilters = () => {
      let result = [...clients];

      // 1) Date filter (if enabled)
      if (dateEnabled && startDate && endDate) {
        const s = new Date(startDate);
        const e = new Date(endDate);
        // Ensure end date includes the whole day by setting to end of day
        e.setHours(23, 59, 59, 999);

        result = result.filter((c) => {
          // Try multiple possible date fields
          const createdValue = (c as any).createdAt ?? (c as any).created_at ?? c.createdAt;
          const created = safeParseDate(createdValue as string | undefined);
          if (!created) {
            // If client has no date, exclude from range when date filter is enabled
            return false;
          }
          return created >= s && created <= e;
        });
      }

      // 2) Multi-term AND search across multiple fields
      const trimmed = search.trim();
      if (trimmed.length > 0) {
        const tokens = trimmed
          .split(/\s+/)
          .map((t) => t.toLowerCase())
          .filter(Boolean);

        result = result.filter((c) => {
          // Build haystack: all searchable fields joined by space
          const hay = [
            c.name ?? "",
            c.phone ?? "",
            c.status ?? "",
            c.assignedEmployee?.name ?? "",
            (c as any).callResponse ?? "",
          ]
            .join(" ")
            .toLowerCase();

          // All tokens must be found somewhere (AND)
          return tokens.every((tk) => hay.includes(tk));
        });
      }

      setFilteredClients(result);
      setCurrentPage(1); // Reset page on filter
      setSelectedIds(new Set()); // Reset selection on search change
      setShowBulkEditModal(false); // Close modal if open
    };

    applyFilters();
  }, [search, clients, dateEnabled, startDate, endDate]);

  /* -------------------------------------------------------------------------- */
  /*                               Status colors                                 */
  /* -------------------------------------------------------------------------- */
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

  /* -------------------------------------------------------------------------- */
  /*                                  CSV Export                                 */
  /* -------------------------------------------------------------------------- */
  // const downloadCSV = () => {
  //   const headers = ["Name", "Phone", "Assigned Employee", "Status", "CallResponse", "CreatedAt"];
  //   const rows = filteredClients.map((c) => [
  //     c.name || "",
  //     c.phone || "",
  //     c?.assignedEmployee?.name || "",
  //     c.status || "",
  //     (c as any).callResponse || "",
  //     (c as any).createdAt ?? (c as any).created_at ?? "",
  //   ]);

  //   const csvContent = [headers, ...rows]
  //     .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(","))
  //     .join("\n");

  //   const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  //   const url = URL.createObjectURL(blob);

  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = "clients.csv";
  //   a.click();

  //   URL.revokeObjectURL(url);
  // };

  const downloadCSV = () => {
  const formatDate = (value: string | Date | undefined | null) => {
    if (!value) return "";
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const headers = ["Name", "Phone", "Assigned Employee", "Status", "CallResponse", "CreatedAt"];
  const rows = filteredClients.map((c) => [
    c.name || "",
    c.phone || "",
    c?.assignedEmployee?.name || "",
    c.status || "",
    (c as any).callResponse || "",
    formatDate((c as any).createdAt ?? (c as any).created_at),
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((f) => `"${String(f).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "clients.csv";
  a.click();

  URL.revokeObjectURL(url);
};


  /* -------------------------------------------------------------------------- */
  /*                                  Pagination                                 */
  /* -------------------------------------------------------------------------- */
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

  /* -------------------------------------------------------------------------- */
  /*                              Bulk selection handlers                        */
  /* -------------------------------------------------------------------------- */

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

  /* -------------------------------------------------------------------------- */
  /*                              Bulk delete / update                           */
  /* -------------------------------------------------------------------------- */

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
  const bulkUpdateClients = async (fields: {
    status: Status;
    courseFee: string;
    courseFeePaid: string;
    hostelFee: string;
    hostelFeePaid: string;
  }) => {
    try {
      // Only include fields that have values
      const updateData: any = {
        ids: Array.from(selectedIds),
        status: fields.status,
      };

      if (fields.courseFee) updateData.courseFee = fields.courseFee;
      if (fields.courseFeePaid) updateData.courseFeePaid = fields.courseFeePaid;
      if (fields.hostelFee) updateData.hostelFee = fields.hostelFee;
      if (fields.hostelFeePaid) updateData.hostelFeePaid = fields.hostelFeePaid;

      const res = await fetch("/api/admin/clients/bulk-update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) throw new Error("Failed to update clients");

      await fetchClients();
      setSelectedIds(new Set());
    } catch (err) {
      throw new Error((err as Error).message || "Error updating clients");
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                           Keyboard shortcuts (helpful)                      */
  /* -------------------------------------------------------------------------- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // ctrl+f focuses search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>('input[placeholder="Search clients..."]');
        if (el) el.focus();
      }

      // ctrl+r refresh
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        fetchClients();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                              Small helpers / UI                             */
  /* -------------------------------------------------------------------------- */

  const ResultSummary = () => {
    return (
      <div className="flex items-center justify-between w-full text-sm text-gray-600">
        <div>
          <strong className="text-gray-800">{filteredClients.length}</strong>{" "}
          result{filteredClients.length !== 1 ? "s" : ""} — showing page {currentPage} of{" "}
          {totalPages || 1}
        </div>
        <div className="flex items-center gap-4">
          <Legend />
          <div className="text-xs text-gray-500">Items per page: {itemsPerPage}</div>
        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                                    Render                                   */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="shadow-sm border rounded-lg p-4 mb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-600">Clients</h1>
          <p className="text-gray-500 text-sm">Manage and monitor all registered clients</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date filter controls */}
          <div className="flex items-center gap-2 bg-white rounded border px-2 py-1">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={dateEnabled}
                onChange={() => setDateEnabled((s) => !s)}
                className="form-checkbox"
              />
              <span>Filter by date</span>
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={!dateEnabled}
              className="border bg-[#615f5f] text-white bg-red border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={!dateEnabled}
              className="border bg-[#615f5f] text-white border-gray-200 rounded-md px-2 py-1 text-sm focus:outline-none"
            />
          </div>

          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
          />
          <button
            onClick={fetchClients}
            className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 transition text-white"
          >
            Refresh
          </button>
          <button
            onClick={downloadCSV}
            className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 transition text-white"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Extra toolbar row: summary + tips */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <ResultSummary />
        <div className="text-xs text-gray-500">
          Tip: search supports multiple words (AND). Example: <code>mamta 4389 notinterested</code>
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

          <button
            onClick={() => setShowBulkEditModal(true)}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500 transition"
          >
            Edit Selected
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Call Response</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((c, idx) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 dark:hover:bg-[#3b3b3b] dark:hover:text-[#dad9d9] cursor-pointer transition-colors border-b last:border-0"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(c.id)}
                        onChange={() => toggleSelectOne(c.id)}
                        onClick={(e) => e.stopPropagation()}
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
                    <td
                      className="px-4 py-3"
                      onClick={() => router.push(`clients/${c.id}`)}
                    >
                      {(c as any).callResponse ? (
                        <span className="text-sm text-gray-700">{(c as any).callResponse}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 text-sm text-gray-600"
                      onClick={() => router.push(`clients/${c.id}`)}
                    >
                      {/* show createdAt / created_at if available */}
                      {(() => {
                        const created = (c as any).createdAt ?? (c as any).created_at;
                        if (!created) return "N/A";
                        const d = safeParseDate(created);
                        if (!d) return String(created);
                        return d.toLocaleDateString();
                      })()}
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

      {/* Bulk Edit Modal */}
      <BulkEditClientsModal
        open={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
        selectedCount={selectedIds.size}
        onConfirm={bulkUpdateClients}
      />
    </div>
  );
}
