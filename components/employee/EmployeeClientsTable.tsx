"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BulkEditClientsModal, BulkEditFields } from "./BulkEditClientsModal";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DeleteDialog } from "../DeleteDialog";

export interface Client {
  id: string;
  name: string | null;
  phone: string | null;
  status: string | null;
  courseFee?: number | null;
  courseFeePaid?: number | null;
  hostelFee?: number | null;
  hostelFeePaid?: number | null;
}

export default function EmployeeClientsTable({ clients: initialClients }: { clients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  // Bulk edit modal state
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditFields, setBulkEditFields] = useState<BulkEditFields>({
    status: "",
    courseFee: "",
    courseFeePaid: "",
    hostelFee: "",
    hostelFeePaid: ""
  });
  const [bulkEditLoading, setBulkEditLoading] = useState(false);

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
    setCurrentPage(1);
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
      setSelectedClientIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    } catch (error) {
      console.error(error);
      toast.error("Error deleting client");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedClientIds.size === 0) return;
    const confirm = window.confirm(`Are you sure you want to delete ${selectedClientIds.size} clients?`);
    if (!confirm) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/employee/clients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientIds: Array.from(selectedClientIds) }),
      });
      if (!res.ok) throw new Error("Bulk delete failed");
      toast.success(`${selectedClientIds.size} clients deleted.`);
      const remainingClients = clients.filter((c) => !selectedClientIds.has(c.id));
      setClients(remainingClients);
      setSelectedClientIds(new Set());
    } catch (err) {
      toast.error("Failed to delete selected clients.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    const allFilteredIds = filteredClients.map((c) => c.id);
    const allSelected = allFilteredIds.every((id) => selectedClientIds.has(id));
    const newSet = new Set(selectedClientIds);
    if (allSelected) {
      allFilteredIds.forEach((id) => newSet.delete(id));
    } else {
      allFilteredIds.forEach((id) => newSet.add(id));
    }
    setSelectedClientIds(newSet);
  };

  const toggleSelectOne = (id: string) => {
    setSelectedClientIds((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
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

  const handleBulkEditOpen = () => {
    if (selectedClientIds.size === 0) return;
    setBulkEditOpen(true);
  };

  const handleBulkEditFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setBulkEditFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleBulkEditClose = () => {
    setBulkEditOpen(false);
    setBulkEditFields({ status: "", courseFee: "", courseFeePaid: "", hostelFee: "", hostelFeePaid: "" });
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const MAX_VISIBLE_PAGES = 5;

    if (totalPages <= MAX_VISIBLE_PAGES) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const left = Math.max(currentPage - 1, 2);
      const right = Math.min(currentPage + 1, totalPages - 1);
      if (left > 2) pages.push("left-ellipsis");
      for (let i = left; i <= right; i++) pages.push(i);
      if (right < totalPages - 1) pages.push("right-ellipsis");
      pages.push(totalPages);
    }

    return pages;
  };

  const handleBulkEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkEditLoading(true);
    try {
      const payload: any = { clientIds: Array.from(selectedClientIds) };
      Object.entries(bulkEditFields).forEach(([key, value]) => {
        if (value !== "") payload[key] = value;
      });
      const res = await fetch("/api/employee/clients/bulk-update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Bulk edit failed");
      toast.success("Clients updated successfully.");
      setClients((prevClients) =>
        prevClients.map((c) =>
          selectedClientIds.has(c.id)
            ? {
                ...c,
                ...Object.fromEntries(
                  Object.entries(bulkEditFields).filter(([_, v]) => v !== "")
                ),
              }
            : c
        )
      );
      handleBulkEditClose();
    } catch (err) {
      toast.error("Bulk edit failed.");
    } finally {
      setBulkEditLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="shadow-sm border rounded-lg p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Clients</h1>
          <p className="text-gray-500 text-sm">Assigned clients only</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
          />
          <button
            onClick={downloadCSV}
            className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white"
          >
            Download CSV
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedClientIds.size === 0 || deleting}
            className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Selected"}
          </button>
          <button
            className={`px-4 py-2 rounded-md bg-yellow-500 text-white ${selectedClientIds.size === 0 ? "cursor-not-allowed opacity-70" : "hover:bg-yellow-400"}`}
            title={selectedClientIds.size === 0 ? "Select clients to bulk edit" : "Bulk Edit"}
            onClick={handleBulkEditOpen}
            disabled={selectedClientIds.size === 0}
          >
            Bulk Edit
          </button>
        </div>
      </div>

      {/* Bulk Edit Modal */}
      <BulkEditClientsModal
        open={bulkEditOpen}
        loading={bulkEditLoading}
        fields={bulkEditFields}
        onChange={handleBulkEditFieldChange}
        onClose={handleBulkEditClose}
        onSubmit={handleBulkEditSubmit}
      />

      {/* Table */}
      {paginatedClients.length > 0 ? (
        <>
          <div className="rounded-lg shadow-sm border overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={filteredClients.length > 0 && filteredClients.every((c) => selectedClientIds.has(c.id))}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Phone</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => router.push(`/employee/clients/${client.id}`)}
                    className="hover:bg-gray-50 hover:text-black cursor-pointer transition-colors border-b last:border-0"
                  >
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClientIds.has(client.id)}
                        onChange={() => toggleSelectOne(client.id)}
                      />
                    </td>
                    <td className="px-4 py-3">{client.name || "N/A"}</td>
                    <td className="px-4 py-3">{client.phone || "N/A"}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(client.status))}>
                        {client.status || "Unknown"}
                      </span>
                    </td>
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="px-4 py-3"
                    >
                      <DeleteDialog onConfirm={() => handleDelete(client.id)} />
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
                  className={`px-3 py-1 rounded border text-sm ${currentPage === page ? "bg-blue-600 text-white" : ""}`}
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
      ) : (
        <div className="text-center py-20 text-gray-500">No clients found.</div>
      )}
    </div>
  );
}