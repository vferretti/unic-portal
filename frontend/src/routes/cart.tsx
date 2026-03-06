import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Trash2, ShoppingCart, Download } from "lucide-react";
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import ExcelJS from "exceljs";
import { useCartContext } from "@/contexts/cart-context";
import { PageHeader } from "@/components/base/page/page-header";
import { Empty } from "@/components/base/page/empty";
import { InputSearch } from "@/components/base/input-search";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/base/table/table";
import { PaginationBar } from "@/components/base/table/pagination";
import { SortableHeader } from "@/components/base/table/sortable-header";
import { Button } from "@/components/base/ui/button";
import { TextCell } from "@/components/base/table/cells";
import { HighlightText } from "@/components/base/highlight-text";
import type { CartItem } from "@/types/cart";

export default function Cart() {
  const { t, i18n } = useTranslation();
  const { items, isLoading, removeVariables, clearCart } = useCartContext();
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 50 });
  const [sorting, setSorting] = useState<SortingState>([]);

  const filteredItems = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return items;
    return items.filter((item) => {
      const label = i18n.language === "fr" ? item.var_label_fr : item.var_label_en;
      return (
        item.var_name?.toLowerCase().includes(query) ||
        label?.toLowerCase().includes(query) ||
        item.tab_name?.toLowerCase().includes(query) ||
        item.rs_name?.toLowerCase().includes(query)
      );
    });
  }, [items, search, i18n.language]);

  const columns = useMemo<ColumnDef<CartItem>[]>(
    () => [
      {
        accessorKey: "var_name",
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t("cart.columns.variable")}
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
        accessorKey: "tab_name",
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t("cart.columns.table")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <TextCell>
            <HighlightText text={getValue<string>()} highlight={search} />
          </TextCell>
        ),
      },
      {
        accessorKey: "rs_name",
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t("cart.columns.resource")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <TextCell>
            <HighlightText text={getValue<string>()} highlight={search} />
          </TextCell>
        ),
      },
      {
        id: "label",
        accessorFn: (row) => (i18n.language === "fr" ? row.var_label_fr : row.var_label_en),
        header: t("cart.columns.label"),
        cell: ({ getValue }) => {
          const val = getValue<string | null>();
          if (!val?.trim()) return <TextCell>{undefined}</TextCell>;
          return (
            <TextCell>
              <HighlightText text={val} highlight={search} />
            </TextCell>
          );
        },
      },
      {
        id: "actions",
        size: 60,
        header: "",
        cell: ({ row }) => (
          <button
            onClick={() => removeVariables([row.original.var_id])}
            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            title={t("cart.remove")}
          >
            <Trash2 className="size-4" />
          </button>
        ),
      },
    ],
    [t, i18n.language, search, removeVariables],
  );

  const table = useReactTable({
    data: filteredItems,
    columns,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleExport = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Variables");
    const headerRow = [
      t("cart.columns.variable"),
      t("cart.columns.label"),
      t("cart.columns.table"),
      t("cart.columns.resource"),
    ];
    ws.addRow(headerRow);
    for (const item of items) {
      ws.addRow([
        item.var_name,
        i18n.language === "fr" ? item.var_label_fr : item.var_label_en,
        item.tab_name,
        item.rs_name,
      ]);
    }
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cart_variables.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageHeader
        title={
          <>
            <ShoppingCart className="size-[1.5rem]" />
            <span className="mx-2">{t("cart.title")}</span>
          </>
        }
        description={t("cart.description")}
      />
      <div className="p-8">
        <div className="rounded-lg border bg-background p-6">
          {isLoading ? (
            <p className="text-muted-foreground">{t("common.loading")}</p>
          ) : items.length === 0 ? (
            <Empty title={t("cart.empty_title")} description={t("cart.empty_description")} />
          ) : (
            <>
              <InputSearch
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                placeholder={t("cart.search")}
                className="mb-4 max-w-2xl"
              />
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">
                  {t("pagination.results", {
                    from: (pagination.pageIndex * pagination.pageSize + 1).toLocaleString(i18n.language),
                    to: Math.min((pagination.pageIndex + 1) * pagination.pageSize, filteredItems.length).toLocaleString(
                      i18n.language,
                    ),
                    total: filteredItems.length.toLocaleString(i18n.language),
                  })}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="size-4 mr-1" />
                    {t("cart.export")}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => clearCart()}>
                    <Trash2 className="size-4 mr-1" />
                    {t("cart.clear")}
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} style={{ width: header.getSize() }}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <PaginationBar
                page={pagination.pageIndex + 1}
                totalPages={table.getPageCount()}
                totalResults={filteredItems.length}
                pageSize={pagination.pageSize}
                showResults={false}
                onPageChange={(p) => table.setPageIndex(p - 1)}
                onPageSizeChange={(size) => {
                  table.setPageSize(size);
                  table.setPageIndex(0);
                }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
