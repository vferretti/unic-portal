import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
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
import { InputSearch } from "@/components/ui/input-search";
import { HighlightText } from "@/components/ui/highlight-text";
import { PageHeader } from "@/components/ui/page-header";
import { useResources } from "@/hooks/useResources";
import {
  getColumnPinningHeaderCN,
  getColumnPinningCellCN,
  getColumnPinningHeaderStyle,
  getColumnPinningCellStyle,
} from "@/lib/table-pinning";
import { cn } from "@/lib/utils";
import type { Resource } from "@/types/resource";

const RESOURCE_TYPE_BADGE: Record<string, "green" | "blue" | "secondary"> = {
  research_project: "green",
  eqp: "blue",
};

const RESOURCE_TYPE_ROUTE: Record<string, string> = {
  research_project: "research_project",
  eqp: "eqp",
};

const PROJECT_STATUS_BADGE: Record<string, "green" | "blue" | "secondary" | "destructive"> = {
  completed: "green",
  active: "blue",
  in_review: "secondary",
};

export default function Resources() {
  const { t, i18n } = useTranslation();
  const { resources, isLoading, error } = useResources();
  const [search, setSearch] = useState("");

  const filteredResources = useMemo(() => {
    if (!search.trim()) return resources;
    const term = search.toLowerCase();
    return resources.filter((r) => {
      const desc = i18n.language === "en" ? r.rs_description_en : r.rs_description_fr;
      return (
        r.rs_name?.toLowerCase().includes(term) ||
        r.rs_project_pi?.toLowerCase().includes(term) ||
        desc?.toLowerCase().includes(term)
      );
    });
  }, [resources, search, i18n.language]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: "rs_name", desc: false },
  ]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: ["dictionary"],
  });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});

  const columns = useMemo<ColumnDef<Resource>[]>(
    () => [
      {
        accessorKey: "rs_name",
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
            {t("resources.columns.name")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">
            <TextCell>
              <HighlightText text={getValue<string>()} highlight={search} />
            </TextCell>
          </span>
        ),
      },
      {
        accessorKey: "rs_type",
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
            {t("resources.columns.type")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => {
          const type = getValue<string>();
          return (
            <BadgeCell variant={RESOURCE_TYPE_BADGE[type] ?? "secondary"}>
              {t(`resources.types.${type}`, { defaultValue: type })}
            </BadgeCell>
          );
        },
      },
      {
        accessorKey: "rs_project_status",
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
            {t("resources.columns.status")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => {
          const status = getValue<string | null>();
          if (!status) return <TextCell>{undefined}</TextCell>;
          return (
            <BadgeCell variant={PROJECT_STATUS_BADGE[status] ?? "secondary"}>
              {t(`resources.statuses.${status}`, { defaultValue: status })}
            </BadgeCell>
          );
        },
      },
      {
        accessorKey: "rs_project_pi",
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
            {t("resources.columns.principal_investigator")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <TextCell>
            <HighlightText text={getValue<string | null>()} highlight={search} />
          </TextCell>
        ),
      },
      {
        id: "dictionary",
        size: 80,
        enableSorting: false,
        enableResizing: false,
        header: ({ column }) => (
          <SortableHeader column={column}>
            {t("resources.columns.dictionary")}
          </SortableHeader>
        ),
        cell: ({ row }) => {
          const route = RESOURCE_TYPE_ROUTE[row.original.rs_type];
          if (!route) return null;
          return (
            <Link
              to={`/catalog/${route}?resource=${encodeURIComponent(row.original.rs_name)}&tab=tables`}
              className="inline-flex items-center justify-center text-primary hover:text-primary/80 transition-colors"
              title={t("resources.columns.dictionary")}
            >
              <BookOpen className="size-4" />
            </Link>
          );
        },
      },
      {
        accessorKey: "rs_last_update",
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
            {t("resources.columns.last_update")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => <DateCell date={getValue<string | null>()} />,
      },
      {
        accessorKey: i18n.language === "en" ? "rs_description_en" : "rs_description_fr",
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
            {t("resources.columns.description")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <TextCell>
            <HighlightText text={getValue<string | null>()} highlight={search} />
          </TextCell>
        ),
      },
    ],
    [t, i18n.language, search],
  );

  const table = useReactTable({
    data: filteredResources,
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
    <>
      <PageHeader
        title={t("resources.title")}
        description={t("resources.description", { count: filteredResources.length })}
      />
      <div className="p-8">
      {isLoading && (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      )}
      {error && (
        <p className="text-destructive">
          {t("common.error", { message: error })}
        </p>
      )}
      {!isLoading && !error && (
        <div className="rounded-lg border bg-background p-6">
          <InputSearch
            value={search}
            onChange={(v) => {
              setSearch(v);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            placeholder={t("common.search_placeholder")}
            className="mb-6 max-w-2xl"
          />
          <div className="text-sm text-muted-foreground mb-1">
            {t("pagination.results", {
              from: pagination.pageIndex * pagination.pageSize + 1,
              to: Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredResources.length),
              total: filteredResources.length,
            })}
          </div>
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
            totalResults={filteredResources.length}
            pageSize={pagination.pageSize}
            showResults={false}
            onPageChange={(p) => table.setPageIndex(p - 1)}
            onPageSizeChange={(size) => {
              table.setPageSize(size);
              table.setPageIndex(0);
            }}
          />
        </div>
      )}
      </div>
    </>
  );
}
