'use client';
import { CallResponse } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export type Client = {
  id: string;
  name: string;
  assignedEmployee?: { id: string; name: string } | null;
  phone: string;
  status: string;
  createdAt?: string;
  callResponse?:CallResponse;
};

export const columns: ColumnDef<Client>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "phone", header: "Phone" },
  { accessorKey: "callResponse", header: "CallResponse" },
  { accessorKey: "createdAt", header: "CreatedAt" },
];
