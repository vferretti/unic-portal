import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useNavigate, Navigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/base/ui/button";
import { useCartContext } from "@/contexts/cart-context";
import {
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type ColumnSizingState,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/base/table/table";
import { PaginationBar } from "@/components/base/table/pagination";
import { SortableHeader } from "@/components/base/table/sortable-header";
import { TextCell, NumberCell, BadgeCell } from "@/components/base/table/cells";
import { InputSearch } from "@/components/base/input-search";
import { HighlightText } from "@/components/base/highlight-text";
import { cn } from "@/lib/utils";
import { Empty } from "@/components/base/page/empty";
import { PageHeader } from "@/components/base/page/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/base/ui/tabs";
import { useResourcesByType } from "@/hooks/useResourcesByType";
import { useTablesByType } from "@/hooks/useTablesByType";
import { useVariablesByType } from "@/hooks/useVariablesByType";
import { useCatalogStats } from "@/hooks/useCatalogStats";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { Resource } from "@/types/resource";
import type { DictTable } from "@/types/dict-table";
import type { DictVariable } from "@/types/dict-variable";

const ROUTE_TO_CATEGORY: Record<string, string> = {
  system: "source_system",
  warehouse: "warehouse",
  research_project: "research_project",
  eqp: "eqp",
};

const CATEGORY_TABS: Record<string, { tabs: string[]; resourceLabel: string; resourceColumnKey: string }> = {
  source_system: {
    tabs: ["resources", "tables", "variables"],
    resourceLabel: "systems",
    resourceColumnKey: "resource",
  },
  warehouse: { tabs: ["tables", "variables"], resourceLabel: "", resourceColumnKey: "resource_warehouse" },
  research_project: {
    tabs: ["resources", "tables", "variables"],
    resourceLabel: "projects",
    resourceColumnKey: "project",
  },
  eqp: { tabs: ["resources", "tables", "variables"], resourceLabel: "projects", resourceColumnKey: "project" },
};

export default function CatalogExploration() {
  const { type } = useParams<{ type: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const category = type ? ROUTE_TO_CATEGORY[type] : undefined;
  const tabConfig = category ? CATEGORY_TABS[category] : undefined;

  const defaultTab = tabConfig?.tabs[0] ?? "tables";
  const paramTab = searchParams.get("tab");
  const activeTab = paramTab && tabConfig?.tabs.includes(paramTab) ? paramTab : defaultTab;
  const selectedSystem = searchParams.get("resource");
  const selectedTable = searchParams.get("table");

  const updateParams = useCallback(
    (updates: Record<string, string | null>, replace = false) => {
      const next = new URLSearchParams(searchParams);
      let changed = false;
      for (const [key, value] of Object.entries(updates)) {
        const current = next.get(key);
        if (value === null) {
          if (current !== null) {
            next.delete(key);
            changed = true;
          }
        } else if (current !== value) {
          next.set(key, value);
          changed = true;
        }
      }
      if (changed) {
        setSearchParams(next, { replace });
      }
    },
    [searchParams, setSearchParams],
  );

  const setActiveTab = useCallback(
    (tab: string) => updateParams({ tab: tab === defaultTab ? null : tab }, true),
    [updateParams, defaultTab],
  );

  const systems = useMemo(() => (selectedSystem ? [selectedSystem] : undefined), [selectedSystem]);
  const tables = useMemo(() => (selectedTable ? [selectedTable] : undefined), [selectedTable]);
  const { stats } = useCatalogStats(systems, tables);
  const typeStat = category ? stats[category] : undefined;

  const handleDrillDown = useCallback(
    (systemName: string, tab: "tables" | "variables") => {
      updateParams({ resource: systemName, table: null, tab: tab === defaultTab ? null : tab });
    },
    [updateParams, defaultTab],
  );

  const handleTableDrillDown = useCallback(
    (tableName: string, systemName: string) => {
      updateParams({ resource: systemName, table: tableName, tab: "variables" });
    },
    [updateParams],
  );

  const tabTitle = useMemo(() => {
    if (!category) return null;
    const typePlural = t(`catalog.categories.${category}.title`);
    const typeSingular = t(`catalog.categories.${category}.title_singular`);
    const ofPlural = t(`catalog.categories.${category}.title_of_plural`);
    const ofSingular = t(`catalog.categories.${category}.title_of_singular`);
    const name = <i>{selectedTable ?? selectedSystem}</i>;

    if (activeTab === "resources") {
      if (selectedSystem)
        return (
          <>
            {typeSingular} {name}
          </>
        );
      return <>{typePlural}</>;
    }
    if (activeTab === "tables") {
      if (selectedSystem)
        return (
          <>
            {t("catalog.tab_titles.tables_prefix")} {ofSingular} {name}
          </>
        );
      return (
        <>
          {t("catalog.tab_titles.tables_prefix")} {ofPlural}
        </>
      );
    }
    // variables
    if (selectedTable)
      return (
        <>
          {t("catalog.tab_titles.variables_of_table")} {name}
        </>
      );
    if (selectedSystem)
      return (
        <>
          {t("catalog.tab_titles.variables_prefix")} {ofSingular} {name}
        </>
      );
    return (
      <>
        {t("catalog.tab_titles.variables_prefix")} {ofPlural}
      </>
    );
  }, [category, activeTab, selectedSystem, selectedTable, t]);

  if (!category) {
    return <Navigate to="/catalog" replace />;
  }

  return (
    <>
      <PageHeader
        title={t(`catalog.categories.${category}.header_title`)}
        description={t(`catalog.categories.${category}.short_description`)}
      />
      <div className="p-8">
        <div className="rounded-lg border bg-background p-6">
          {/* Dynamic title above tabs */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => {
                if (selectedTable) {
                  updateParams({ table: null });
                } else if (selectedSystem) {
                  updateParams({ resource: null, tab: null });
                } else {
                  navigate("/catalog");
                }
              }}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="size-5" />
            </button>
            <h2 className="text-lg font-semibold">{tabTitle}</h2>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b mb-4">
              <TabsList variant="line" className="pb-0 gap-4">
                {tabConfig?.tabs.includes("resources") && (
                  <TabsTrigger value="resources">
                    {t(`catalog.tabs.${tabConfig.resourceLabel}`)}
                    {typeStat ? ` (${typeStat.resource_count.toLocaleString(i18n.language)})` : ""}
                  </TabsTrigger>
                )}
                <TabsTrigger value="tables">
                  {t("catalog.tabs.tables")}
                  {typeStat ? ` (${typeStat.table_count.toLocaleString(i18n.language)})` : ""}
                </TabsTrigger>
                <TabsTrigger value="variables">
                  {t("catalog.tabs.variables")}
                  {typeStat ? ` (${typeStat.variable_count.toLocaleString(i18n.language)})` : ""}
                </TabsTrigger>
              </TabsList>
            </div>
            {tabConfig?.tabs.includes("resources") && (
              <TabsContent value="resources">
                <ResourceTable category={category} systems={systems} onDrillDown={handleDrillDown} />
              </TabsContent>
            )}
            <TabsContent value="tables">
              <DictTableTable
                category={category}
                systems={systems}
                tables={tables}
                onTableDrillDown={handleTableDrillDown}
              />
            </TabsContent>
            <TabsContent value="variables">
              <DictVariableTable category={category} systems={systems} tables={tables} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

const RESOURCE_SORT_FIELDS: Record<string, string> = {
  rs_name: "rs_name",
  description: "rs_description_en",
  table_count: "stat_etl.table_count",
  variable_count: "stat_etl.variable_count",
};

function ResourceTable({
  category,
  systems,
  onDrillDown,
}: {
  category: string;
  systems?: string[];
  onDrillDown: (systemName: string, tab: "tables" | "variables") => void;
}) {
  const { t, i18n } = useTranslation();

  const [sorting, setSorting] = useState<SortingState>([{ id: "rs_name", desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const systemsKey = systems?.join(",") ?? "";
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [systemsKey, debouncedSearch]);

  const sortField = RESOURCE_SORT_FIELDS[sorting[0]?.id] ?? "rs_name";
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const { data, total, isLoading, error } = useResourcesByType(category, {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sortField,
    sortOrder,
    systems,
    search: debouncedSearch || undefined,
  });

  const handleSortingChange = useCallback((updater: SortingState | ((old: SortingState) => SortingState)) => {
    setSorting(updater);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const columns = useMemo<ColumnDef<Resource>[]>(
    () => [
      {
        accessorKey: "rs_name",
        size: 120,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t("catalog.exploration.columns.name")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">
            <TextCell>
              <HighlightText text={getValue<string>()} highlight={debouncedSearch} />
            </TextCell>
          </span>
        ),
      },
      {
        accessorKey: i18n.language === "en" ? "rs_description_en" : "rs_description_fr",
        id: "description",
        size: 600,
        enableSorting: false,
        header: () => t("catalog.exploration.columns.description"),
        cell: ({ getValue }) => {
          const val = getValue<string | null>();
          if (!val) return <TextCell>{undefined}</TextCell>;
          return <HighlightText text={val} highlight={debouncedSearch} />;
        },
      },
      {
        accessorFn: (row) => row.stat_etl?.table_count ?? null,
        id: "table_count",
        size: 70,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t("catalog.exploration.columns.table_count")}
          </SortableHeader>
        ),
        cell: ({ row, getValue }) => {
          const count = getValue<number | null>();
          if (!count) return <NumberCell value={undefined} fractionDigits={0} />;
          return (
            <button
              className="text-primary underline cursor-pointer hover:no-underline"
              onClick={() => onDrillDown(row.original.rs_name, "tables")}
            >
              {count.toLocaleString(i18n.language)}
            </button>
          );
        },
      },
      {
        accessorFn: (row) => row.stat_etl?.variable_count ?? null,
        id: "variable_count",
        size: 70,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t("catalog.exploration.columns.variable_count")}
          </SortableHeader>
        ),
        cell: ({ row, getValue }) => {
          const count = getValue<number | null>();
          if (!count) return <NumberCell value={undefined} fractionDigits={0} />;
          return (
            <button
              className="text-primary underline cursor-pointer hover:no-underline"
              onClick={() => onDrillDown(row.original.rs_name, "variables")}
            >
              {count.toLocaleString(i18n.language)}
            </button>
          );
        },
      },
    ],
    [t, i18n.language, onDrillDown, debouncedSearch],
  );

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    enableColumnResizing: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: { sorting, pagination, columnSizing },
    onSortingChange: handleSortingChange,
    onPaginationChange: setPagination,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <InputSearch
        value={search}
        onChange={setSearch}
        placeholder={t("catalog.exploration.search_systems")}
        className="mb-4 max-w-2xl"
      />
      {isLoading && data.length === 0 ? (
        <p className="text-muted-foreground mt-4">{t("common.loading")}</p>
      ) : error ? (
        <p className="text-destructive mt-4">{t("common.error", { message: error })}</p>
      ) : data.length === 0 ? (
        <Empty title={t("table.no_result")} description={t("table.no_result_description")} />
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-1">
            {t("pagination.results", {
              from: (pagination.pageIndex * pagination.pageSize + 1).toLocaleString(i18n.language),
              to: Math.min((pagination.pageIndex + 1) * pagination.pageSize, total).toLocaleString(i18n.language),
              total: total.toLocaleString(i18n.language),
            })}
          </div>
          <Table style={{ tableLayout: "fixed" }}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} style={{ width: header.getSize(), position: "relative" }}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
            totalResults={total}
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
  );
}

const TABLE_SORT_FIELDS: Record<string, string> = {
  tab_name: "tab_name",
  rs_name: "resource.rs_name",
  tab_domain: "tab_domain",
  variable_count: "stat_etl.variable_count",
};

function DictTableTable({
  category,
  systems,
  tables,
  onTableDrillDown,
}: {
  category: string;
  systems?: string[];
  tables?: string[];
  onTableDrillDown: (tableName: string, systemName: string) => void;
}) {
  const { t, i18n } = useTranslation();

  const [sorting, setSorting] = useState<SortingState>([{ id: "tab_name", desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const systemsKey = systems?.join(",") ?? "";
  const tablesKey = tables?.join(",") ?? "";
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [systemsKey, tablesKey, debouncedSearch]);

  const sortField = TABLE_SORT_FIELDS[sorting[0]?.id] ?? "tab_name";
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const { data, total, isLoading, error } = useTablesByType(category, {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sortField,
    sortOrder,
    systems,
    tables,
    search: debouncedSearch || undefined,
  });

  const handleSortingChange = useCallback((updater: SortingState | ((old: SortingState) => SortingState)) => {
    setSorting(updater);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const columns = useMemo(() => {
    const cols: ColumnDef<DictTable>[] = [
      {
        accessorKey: "tab_name",
        size: 200,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t("catalog.exploration.columns.name")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">
            <TextCell>
              <HighlightText text={getValue<string>()} highlight={debouncedSearch} />
            </TextCell>
          </span>
        ),
      },
    ];
    if (category !== "warehouse") {
      cols.push({
        accessorFn: (row) => row.resource?.rs_name ?? null,
        id: "rs_name",
        size: 150,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t(`catalog.exploration.columns.${CATEGORY_TABS[category].resourceColumnKey}`)}
          </SortableHeader>
        ),
        cell: ({ getValue }) => {
          const val = getValue<string | null>();
          if (!val) return <TextCell>{undefined}</TextCell>;
          return <HighlightText text={val} highlight={debouncedSearch} />;
        },
      });
    }
    cols.push(
      {
        accessorKey: "tab_domain",
        size: 150,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t("catalog.exploration.columns.domain")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => {
          const val = getValue<string | null>();
          if (!val) return <TextCell>{undefined}</TextCell>;
          return <HighlightText text={val} highlight={debouncedSearch} />;
        },
      },
      {
        accessorFn: (row) => row.stat_etl?.variable_count ?? null,
        id: "variable_count",
        size: 100,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t("catalog.exploration.columns.variable_count")}
          </SortableHeader>
        ),
        cell: ({ row, getValue }) => {
          const count = getValue<number | null>();
          const systemName = row.original.resource?.rs_name;
          if (!count || !systemName) return <NumberCell value={count ?? undefined} fractionDigits={0} />;
          return (
            <button
              className="text-primary underline cursor-pointer hover:no-underline"
              onClick={() => onTableDrillDown(row.original.tab_name, systemName)}
            >
              {count.toLocaleString(i18n.language)}
            </button>
          );
        },
      },
    );
    return cols;
  }, [t, category, onTableDrillDown, debouncedSearch]);

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    enableColumnResizing: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: { sorting, pagination, columnSizing },
    onSortingChange: handleSortingChange,
    onPaginationChange: setPagination,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <InputSearch
        value={search}
        onChange={setSearch}
        placeholder={t("catalog.exploration.search_tables")}
        className="mb-4 max-w-2xl"
      />
      {isLoading && data.length === 0 ? (
        <p className="text-muted-foreground mt-4">{t("common.loading")}</p>
      ) : error ? (
        <p className="text-destructive mt-4">{t("common.error", { message: error })}</p>
      ) : data.length === 0 ? (
        <Empty title={t("table.no_result")} description={t("table.no_result_description")} />
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-1">
            {t("pagination.results", {
              from: (pagination.pageIndex * pagination.pageSize + 1).toLocaleString(i18n.language),
              to: Math.min((pagination.pageIndex + 1) * pagination.pageSize, total).toLocaleString(i18n.language),
              total: total.toLocaleString(i18n.language),
            })}
          </div>
          <Table style={{ tableLayout: "fixed" }}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} style={{ width: header.getSize(), position: "relative" }}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
            totalResults={total}
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
  );
}

const VARIABLE_TYPE_BADGE: Record<string, "green" | "blue" | "secondary" | "amber" | "violet" | "outline"> = {
  string: "secondary",
  integer: "blue",
  decimal: "violet",
  boolean: "green",
  date: "amber",
  datetime: "amber",
};

const VARIABLE_SORT_FIELDS: Record<string, string> = {
  var_name: "var_name",
  tab_name: "table.tab_name",
  rs_name: "resource.rs_name",
  var_value_type: "var_value_type",
};

function DictVariableTable({ category, systems, tables }: { category: string; systems?: string[]; tables?: string[] }) {
  const { t, i18n } = useTranslation();
  const { selectedVarIds, addVariables, removeVariables } = useCartContext();

  const [sorting, setSorting] = useState<SortingState>([{ id: "var_name", desc: false }]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 50,
  });
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const systemsKey = systems?.join(",") ?? "";
  const tablesKey = tables?.join(",") ?? "";
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [systemsKey, tablesKey, debouncedSearch]);

  const sortField = VARIABLE_SORT_FIELDS[sorting[0]?.id] ?? "var_name";
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const { data, total, isLoading, error } = useVariablesByType(category, {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sortField,
    sortOrder,
    systems,
    tables,
    search: debouncedSearch || undefined,
  });

  const handleSortingChange = useCallback((updater: SortingState | ((old: SortingState) => SortingState)) => {
    setSorting(updater);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, []);

  const columns = useMemo(() => {
    const cols: ColumnDef<DictVariable>[] = [
      {
        id: "select",
        size: 40,
        enableSorting: false,
        enableResizing: false,
        header: () => {
          const pageVarIds = data.map((v) => v.var_id);
          const allPageSelected = pageVarIds.length > 0 && pageVarIds.every((id) => selectedVarIds.has(id));
          return (
            <Button
              variant="ghost"
              size="icon-xs"
              className={allPageSelected ? "text-primary" : "text-muted-foreground"}
              onClick={() => {
                if (allPageSelected) {
                  removeVariables(pageVarIds);
                } else {
                  const toAdd = data.filter((v) => !selectedVarIds.has(v.var_id));
                  if (toAdd.length > 0) addVariables(toAdd);
                }
              }}
            >
              <ShoppingCart className={cn("size-4", allPageSelected && "fill-current")} />
            </Button>
          );
        },
        cell: ({ row }) => {
          const varId = row.original.var_id;
          const isSelected = selectedVarIds.has(varId);
          return (
            <Button
              variant="ghost"
              size="icon-xs"
              className={isSelected ? "text-primary" : "text-muted-foreground"}
              onClick={() => {
                if (isSelected) {
                  removeVariables([varId]);
                } else {
                  addVariables([row.original]);
                }
              }}
            >
              <ShoppingCart className={cn("size-4", isSelected && "fill-current")} />
            </Button>
          );
        },
      },
      {
        accessorKey: "var_name",
        size: 200,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t("catalog.exploration.columns.name")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => (
          <span className="font-medium">
            <TextCell>
              <HighlightText text={getValue<string>()} highlight={debouncedSearch} />
            </TextCell>
          </span>
        ),
      },
      {
        accessorKey: i18n.language === "en" ? "var_label_en" : "var_label_fr",
        id: "label",
        size: 250,
        enableSorting: false,
        header: () => t("catalog.exploration.columns.label"),
        cell: ({ getValue }) => {
          const val = getValue<string | null>();
          if (!val) return <TextCell>{undefined}</TextCell>;
          return <HighlightText text={val} highlight={debouncedSearch} />;
        },
      },
      {
        accessorFn: (row) => row.table?.tab_name ?? null,
        id: "tab_name",
        size: 150,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t("catalog.exploration.columns.table")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => <TextCell>{getValue<string | null>()}</TextCell>,
      },
    ];
    if (category !== "warehouse") {
      cols.push({
        accessorFn: (row) => row.resource?.rs_name ?? null,
        id: "rs_name",
        size: 150,
        header: ({ column }) => (
          <SortableHeader
            sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
            onSort={column.getToggleSortingHandler()}
            column={column}
          >
            {t(`catalog.exploration.columns.${CATEGORY_TABS[category].resourceColumnKey}`)}
          </SortableHeader>
        ),
        cell: ({ getValue }) => <TextCell>{getValue<string | null>()}</TextCell>,
      });
    }
    cols.push({
      accessorKey: "var_value_type",
      id: "var_value_type",
      size: 120,
      header: ({ column }) => (
        <SortableHeader
          sortDirection={column.getIsSorted() === "asc" ? "asc" : column.getIsSorted() === "desc" ? "desc" : null}
          onSort={column.getToggleSortingHandler()}
          column={column}
        >
          {t("catalog.exploration.columns.type")}
        </SortableHeader>
      ),
      cell: ({ getValue }) => {
        const type = getValue<string | null>();
        return <BadgeCell variant={type ? (VARIABLE_TYPE_BADGE[type] ?? "secondary") : undefined}>{type}</BadgeCell>;
      },
    });
    if (category !== "source_system") {
      cols.push({
        accessorFn: (row) => row.var_from_source_systems,
        id: "source_systems",
        size: 200,
        enableSorting: false,
        header: () => t("catalog.exploration.columns.source_systems"),
        cell: ({ getValue }) => {
          const systems = getValue<{ rs_name: string }[] | null>();
          if (!systems || systems.length === 0) return <TextCell>{undefined}</TextCell>;
          return (
            <span>
              {systems.map((s: { rs_name: string }, i: number) => (
                <span key={s.rs_name}>
                  {i > 0 && ", "}
                  <Link
                    to={`/catalog/system?resource=${encodeURIComponent(s.rs_name)}&tab=tables`}
                    className="text-primary underline hover:no-underline"
                  >
                    {s.rs_name}
                  </Link>
                </span>
              ))}
            </span>
          );
        },
      });
    }
    return cols;
  }, [t, i18n.language, category, debouncedSearch, data, selectedVarIds, addVariables, removeVariables]);

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: "onChange",
    columnResizeDirection: "ltr",
    enableColumnResizing: true,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(total / pagination.pageSize),
    state: { sorting, pagination, columnSizing },
    onSortingChange: handleSortingChange,
    onPaginationChange: setPagination,
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <InputSearch
        value={search}
        onChange={setSearch}
        placeholder={t("catalog.exploration.search_variables")}
        className="mb-4 max-w-2xl"
      />
      {isLoading && data.length === 0 ? (
        <p className="text-muted-foreground mt-4">{t("common.loading")}</p>
      ) : error ? (
        <p className="text-destructive mt-4">{t("common.error", { message: error })}</p>
      ) : data.length === 0 ? (
        <Empty title={t("table.no_result")} description={t("table.no_result_description")} />
      ) : (
        <>
          <div className="text-sm text-muted-foreground mb-1">
            {t("pagination.results", {
              from: (pagination.pageIndex * pagination.pageSize + 1).toLocaleString(i18n.language),
              to: Math.min((pagination.pageIndex + 1) * pagination.pageSize, total).toLocaleString(i18n.language),
              total: total.toLocaleString(i18n.language),
            })}
          </div>
          <Table style={{ tableLayout: "fixed" }}>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} style={{ width: header.getSize(), position: "relative" }}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
            totalResults={total}
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
  );
}
