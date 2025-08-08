'use client';

import { useRouter } from "next/navigation";
import { ColumnDef, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  rowLinkPrefix?: string; // 👈 NEW
  getRowId?: (row: TData) => string; // Optional custom id getter
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  rowLinkPrefix,
  getRowId = (row) => row.id,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const router = useRouter();

  const handleRowClick = (id: string) => {
    if (rowLinkPrefix) {
      router.push(`${rowLinkPrefix}/${id}`);
    }
  };

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className="whitespace-nowrap px-2 py-1 text-sm sm:px-4 sm:py-2 sm:text-base"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => {
              const id = getRowId(row.original);

              return (
                <TableRow
                  key={row.id}
                  onClick={() => handleRowClick(id)}
                  className={rowLinkPrefix ? "cursor-pointer hover:bg-muted/50 transition" : ""}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap px-2 py-1 text-sm sm:px-4 sm:py-2 sm:text-base"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
