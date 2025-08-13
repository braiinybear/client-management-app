'use client';
import { ColumnDef } from "@tanstack/react-table";

export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
};

export const columns: ColumnDef<Client>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "phone", header: "Phone" },
];
