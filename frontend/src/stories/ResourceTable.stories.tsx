import { useMemo, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type ColumnPinningState,
  type ColumnSizingState,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationBar } from "@/components/ui/pagination";
import { SortableHeader } from "@/components/ui/sortable-header";
import { TextCell, DateCell, BadgeCell } from "@/components/ui/cells";
import {
  getColumnPinningHeaderCN,
  getColumnPinningCellCN,
  getColumnPinningHeaderStyle,
  getColumnPinningCellStyle,
} from "@/lib/table-pinning";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types/resource";

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  research_project: "Research",
  eqp: "EQP",
  warehouse: "Warehouse",
  source_system: "Source System",
};

const RESOURCE_TYPE_BADGE: Record<string, "green" | "blue" | "secondary"> = {
  research_project: "green",
  eqp: "blue",
};

const resources: Resource[] = Array.from({ length: 45 }, (_, i) => ({
  name: `Research Project ${i + 1}`,
  resource_type: i % 3 === 0 ? "eqp" : "research_project",
  last_update:
    i % 5 === 0 ? null : `2025-${String((i % 12) + 1).padStart(2, "0")}-15`,
  project_principal_investigator:
    i % 4 === 0 ? null : `Dr. Researcher ${i + 1}`,
  description_fr:
    i % 3 === 0 ? null : `Description du projet de recherche ${i + 1}`,
}));

function ResourceTable() {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "name", desc: false },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: [],
  });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const columns = useMemo<ColumnDef<Resource>[]>(
    () => [
      {
        accessorKey: "name",
        size: 200,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={
              column.getIsSorted() === "asc"
                ? "asc"
                : column.getIsSorted() === "desc"
                  ? "desc"
                  : null
            }
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            Name
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">
            <TextCell>{getValue<string>()}</TextCell>
          </span>
        ),
      },
      {
        accessorKey: "resource_type",
        size: 100,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={
              column.getIsSorted() === "asc"
                ? "asc"
                : column.getIsSorted() === "desc"
                  ? "desc"
                  : null
            }
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            Type
          </SortableHeader>
        ),
        cell: ({ getValue }) => {
          const type = getValue<string>();
          return (
            <BadgeCell variant={RESOURCE_TYPE_BADGE[type] ?? "secondary"}>
              {RESOURCE_TYPE_LABELS[type] ?? type}
            </BadgeCell>
          );
        },
      },
      {
        accessorKey: "last_update",
        size: 120,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={
              column.getIsSorted() === "asc"
                ? "asc"
                : column.getIsSorted() === "desc"
                  ? "desc"
                  : null
            }
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            Last Update
          </SortableHeader>
        ),
        cell: ({ getValue }) => <DateCell date={getValue<string | null>()} />,
      },
      {
        accessorKey: "project_principal_investigator",
        size: 200,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={
              column.getIsSorted() === "asc"
                ? "asc"
                : column.getIsSorted() === "desc"
                  ? "desc"
                  : null
            }
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            Principal Investigator
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <TextCell>{getValue<string | null>() ?? undefined}</TextCell>
        ),
      },
      {
        accessorKey: "description_fr",
        size: 500,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={
              column.getIsSorted() === "asc"
                ? "asc"
                : column.getIsSorted() === "desc"
                  ? "desc"
                  : null
            }
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            Description (FR)
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <TextCell>{getValue<string | null>() ?? undefined}</TextCell>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: resources,
    columns,
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    enableColumnResizing: true,
    state: { sorting, pagination, columnPinning, columnSizing },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnPinningChange: setColumnPinning,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="mx-auto max-w-6xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Resources</h1>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={getColumnPinningHeaderCN(header)}
                  style={getColumnPinningHeaderStyle(header)}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                  {header.column.getCanResize() && (
                    <div
                      onDoubleClick={() => header.column.resetSize()}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={cn(
                        "absolute top-0 right-0 h-full w-1 cursor-col-resize select-none touch-none bg-foreground/50 opacity-0 hover:opacity-50",
                        header.column.getIsResizing() && "opacity-100",
                      )}
                    />
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={getColumnPinningCellCN(cell.column)}
                  style={getColumnPinningCellStyle(cell.column)}
                >
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationBar
        page={pagination.pageIndex + 1}
        totalPages={table.getPageCount()}
        totalResults={resources.length}
        pageSize={pagination.pageSize}
        onPageChange={(p) => table.setPageIndex(p - 1)}
        onPageSizeChange={(size) => {
          table.setPageSize(size);
          table.setPageIndex(0);
        }}
      />
    </div>
  );
}

const meta: Meta<typeof ResourceTable> = {
  title: "Features/ResourceTable",
  component: ResourceTable,
};

export default meta;
type Story = StoryObj<typeof ResourceTable>;

export const Default: Story = {};
