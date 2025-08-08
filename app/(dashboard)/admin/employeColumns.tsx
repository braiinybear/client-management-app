import { ColumnDef } from "@tanstack/react-table";

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string; // or whatever fields you need
};

export const columns: ColumnDef<Employee>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role" },
];
