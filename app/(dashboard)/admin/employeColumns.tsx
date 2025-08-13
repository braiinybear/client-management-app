import { ColumnDef } from "@tanstack/react-table";

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export const columns: ColumnDef<Employee>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
  },
  {
    id: "email",
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "role",
    accessorKey: "role",
    header: "Role",
  },
];
