import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, Navigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";
import {
  type ColumnDef,
  type SortingState,
  type PaginationState,
  type ColumnSizingState,
  useReactTable,
  getCoreRowModel,
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
import { TextCell, NumberCell, BadgeCell } from "@/components/ui/cells";
import { InputSearch } from "@/components/ui/input-search";
import { HighlightText } from "@/components/ui/highlight-text";
import { cn } from "@/lib/utils";
import { Empty } from "@/components/ui/empty";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  source_system:    { tabs: ["resources", "tables", "variables"], resourceLabel: "systems",  resourceColumnKey: "resource" },
  warehouse:        { tabs: ["tables", "variables"],              resourceLabel: "",         resourceColumnKey: "resource_warehouse" },
  research_project: { tabs: ["resources", "tables", "variables"], resourceLabel: "projects", resourceColumnKey: "project" },
  eqp:              { tabs: ["resources", "tables", "variables"], resourceLabel: "projects", resourceColumnKey: "project" },
};

export default function CatalogExploration() {
  const { type } = useParams<{ type: string }>();
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();
  const category = type ? ROUTE_TO_CATEGORY[type] : undefined;
  const tabConfig = category ? CATEGORY_TABS[category] : undefined;

  const [activeTab, setActiveTab] = useState(() => {
    const paramTab = searchParams.get("tab");
    if (paramTab && tabConfig?.tabs.includes(paramTab)) return paramTab;
    return tabConfig?.tabs[0] ?? "tables";
  });
  const [selectedSystem, setSelectedSystem] = useState<string | null>(
    () => searchParams.get("resource"),
  );
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const prevCategoryRef = useRef(category);
  useEffect(() => {
    if (category === prevCategoryRef.current) return;
    prevCategoryRef.current = category;
    if (tabConfig) {
      const paramResource = searchParams.get("resource");
      const paramTab = searchParams.get("tab");
      setSelectedSystem(paramResource);
      setSelectedTable(null);
      setActiveTab(paramTab && tabConfig.tabs.includes(paramTab) ? paramTab : tabConfig.tabs[0]);
      if (!paramResource && !paramTab) {
        setSearchParams({}, { replace: true });
      }
    }
  }, [category]); // eslint-disable-line react-hooks/exhaustive-deps

  const systems = useMemo(() => selectedSystem ? [selectedSystem] : undefined, [selectedSystem]);
  const tables = useMemo(() => selectedTable ? [selectedTable] : undefined, [selectedTable]);
  const { stats } = useCatalogStats(systems, tables);
  const typeStat = category ? stats[category] : undefined;

  const handleDrillDown = useCallback((systemName: string, tab: "tables" | "variables") => {
    setSelectedSystem(systemName);
    setSelectedTable(null);
    setActiveTab(tab);
  }, []);

  const handleTableDrillDown = useCallback((tableName: string, systemName: string) => {
    setSelectedSystem(systemName);
    setSelectedTable(tableName);
    setActiveTab("variables");
  }, []);

  const handleClearFilter = useCallback(() => {
    setSelectedSystem(null);
    setSelectedTable(null);
    if (tabConfig) setActiveTab(tabConfig.tabs[0]);
  }, [tabConfig]);

  if (!category) {
    return <Navigate to="/catalog" replace />;
  }

  return (
    <>
      <PageHeader
        title={
          <>
            <Link to="/catalog" className="text-muted-foreground hover:text-foreground transition-colors"><BookOpen className="size-[1.5rem]" /></Link>
            <span className="text-muted-foreground mx-2 font-normal">/</span>
            {selectedSystem ? (
              <>
                <Link
                  to={`/catalog/${type}`}
                  onClick={(e) => { e.preventDefault(); handleClearFilter(); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t(`catalog.categories.${category}.title`)}
                </Link>
                {category !== "warehouse" && (
                  <>
                    <span className="text-muted-foreground mx-2 font-normal">/</span>
                    {selectedTable ? (
                      <button
                        onClick={() => setSelectedTable(null)}
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {selectedSystem}
                      </button>
                    ) : (
                      selectedSystem
                    )}
                  </>
                )}
                {selectedTable && (
                  <>
                    <span className="text-muted-foreground mx-2 font-normal">/</span>
                    {selectedTable}
                  </>
                )}
              </>
            ) : (
              t(`catalog.categories.${category}.title`)
            )}
          </>
        }
        description={t(`catalog.categories.${category}.short_description`)}
      />
      <div className="p-8">
        <div className="rounded-lg border bg-background p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center border-b mb-4">
            <TabsList variant="line" className="pb-0 gap-4">
              {tabConfig?.tabs.includes("resources") && (
                <TabsTrigger value="resources">
                  {t(`catalog.tabs.${tabConfig.resourceLabel}`)}{typeStat ? ` (${typeStat.resource_count.toLocaleString()})` : ""}
                </TabsTrigger>
              )}
              <TabsTrigger value="tables">
                {t("catalog.tabs.tables")}{typeStat ? ` (${typeStat.table_count.toLocaleString()})` : ""}
              </TabsTrigger>
              <TabsTrigger value="variables">
                {t("catalog.tabs.variables")}{typeStat ? ` (${typeStat.variable_count.toLocaleString()})` : ""}
              </TabsTrigger>
            </TabsList>
              {(selectedSystem || selectedTable) && (
                <div className="ml-auto flex items-center gap-2 pb-1">
                  <span className="text-sm text-muted-foreground">
                    <span className="font-bold">{t("catalog.exploration.filters.filtered_by")}</span> {selectedTable ?? selectedSystem}
                  </span>
                  <button
                    onClick={handleClearFilter}
                    className="text-sm text-primary underline hover:no-underline cursor-pointer"
                  >
                    {t("catalog.exploration.filters.clear")}
                  </button>
                </div>
              )}
            </div>
            {tabConfig?.tabs.includes("resources") && (
              <TabsContent value="resources">
                <ResourceTable category={category} systems={systems} onDrillDown={handleDrillDown} />
              </TabsContent>
            )}
            <TabsContent value="tables">
              <DictTableTable category={category} systems={systems} tables={tables} onTableDrillDown={handleTableDrillDown} />
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

function ResourceTable({ category, systems, onDrillDown }: { category: string; systems?: string[]; onDrillDown: (systemName: string, tab: "tables" | "variables") => void }) {
  const { t, i18n } = useTranslation();

  const [sorting, setSorting] = useState<SortingState>([
    { id: "rs_name", desc: false },
  ]);
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
              {count.toLocaleString()}
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
              {count.toLocaleString()}
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
        <p className="text-destructive mt-4">
          {t("common.error", { message: error })}
        </p>
      ) : data.length === 0 ? (
        <Empty
          title={t("table.no_result")}
          description={t("table.no_result_description")}
        />
      ) : <>
      <div className="text-sm text-muted-foreground mb-1">
        {t("pagination.results", {
          from: pagination.pageIndex * pagination.pageSize + 1,
          to: Math.min((pagination.pageIndex + 1) * pagination.pageSize, total),
          total,
        })}
      </div>
      <Table style={{ tableLayout: "fixed" }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize(), position: "relative" }}>
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
                <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
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
        totalResults={total}
        pageSize={pagination.pageSize}
        showResults={false}
        onPageChange={(p) => table.setPageIndex(p - 1)}
        onPageSizeChange={(size) => {
          table.setPageSize(size);
          table.setPageIndex(0);
        }}
      />
      </>}
    </div>
  );
}

const TABLE_SORT_FIELDS: Record<string, string> = {
  tab_name: "tab_name",
  rs_name: "resource.rs_name",
  tab_domain: "tab_domain",
  variable_count: "stat_etl.variable_count",
};

function DictTableTable({ category, systems, tables, onTableDrillDown }: { category: string; systems?: string[]; tables?: string[]; onTableDrillDown: (tableName: string, systemName: string) => void }) {
  const { t } = useTranslation();

  const [sorting, setSorting] = useState<SortingState>([
    { id: "tab_name", desc: false },
  ]);
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

  const columns = useMemo<ColumnDef<DictTable>[]>(
    () => [
      {
        accessorKey: "tab_name",
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
      category !== "warehouse" && {
        accessorFn: (row) => row.resource?.rs_name ?? null,
        id: "rs_name",
        size: 150,
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
            {t(`catalog.exploration.columns.${CATEGORY_TABS[category].resourceColumnKey}`)}
          </SortableHeader>
        ),
        cell: ({ getValue }) => {
          const val = getValue<string | null>();
          if (!val) return <TextCell>{undefined}</TextCell>;
          return <HighlightText text={val} highlight={debouncedSearch} />;
        },
      },
      {
        accessorKey: "tab_domain",
        size: 150,
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
              {count.toLocaleString()}
            </button>
          );
        },
      },
    ].filter(Boolean) as ColumnDef<DictTable>[],
    [t, category, onTableDrillDown, debouncedSearch],
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
        placeholder={t("catalog.exploration.search_tables")}
        className="mb-4 max-w-2xl"
      />
      {isLoading && data.length === 0 ? (
        <p className="text-muted-foreground mt-4">{t("common.loading")}</p>
      ) : error ? (
        <p className="text-destructive mt-4">
          {t("common.error", { message: error })}
        </p>
      ) : data.length === 0 ? (
        <Empty
          title={t("table.no_result")}
          description={t("table.no_result_description")}
        />
      ) : <>
      <div className="text-sm text-muted-foreground mb-1">
        {t("pagination.results", {
          from: pagination.pageIndex * pagination.pageSize + 1,
          to: Math.min((pagination.pageIndex + 1) * pagination.pageSize, total),
          total,
        })}
      </div>
      <Table style={{ tableLayout: "fixed" }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize(), position: "relative" }}>
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
                <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
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
        totalResults={total}
        pageSize={pagination.pageSize}
        showResults={false}
        onPageChange={(p) => table.setPageIndex(p - 1)}
        onPageSizeChange={(size) => {
          table.setPageSize(size);
          table.setPageIndex(0);
        }}
      />
      </>}
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

  const [sorting, setSorting] = useState<SortingState>([
    { id: "var_name", desc: false },
  ]);
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

  const columns = useMemo<ColumnDef<DictVariable>[]>(
    () => [
      {
        accessorKey: "var_name",
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
            {t("catalog.exploration.columns.table")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => <TextCell>{getValue<string | null>()}</TextCell>,
      },
      category !== "warehouse" && {
        accessorFn: (row) => row.resource?.rs_name ?? null,
        id: "rs_name",
        size: 150,
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
            {t(`catalog.exploration.columns.${CATEGORY_TABS[category].resourceColumnKey}`)}
          </SortableHeader>
        ),
        cell: ({ getValue }) => <TextCell>{getValue<string | null>()}</TextCell>,
      },
      {
        accessorKey: "var_value_type",
        id: "var_value_type",
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
            {t("catalog.exploration.columns.type")}
          </SortableHeader>
        ),
        cell: ({ getValue }) => {
          const type = getValue<string | null>();
          return (
            <BadgeCell variant={type ? VARIABLE_TYPE_BADGE[type] ?? "secondary" : undefined}>
              {type}
            </BadgeCell>
          );
        },
      },
      category !== "source_system" && {
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
              {systems.map((s, i) => (
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
      },
    ].filter(Boolean) as ColumnDef<DictVariable>[],
    [t, i18n.language, category, debouncedSearch],
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
        placeholder={t("catalog.exploration.search_variables")}
        className="mb-4 max-w-2xl"
      />
      {isLoading && data.length === 0 ? (
        <p className="text-muted-foreground mt-4">{t("common.loading")}</p>
      ) : error ? (
        <p className="text-destructive mt-4">
          {t("common.error", { message: error })}
        </p>
      ) : data.length === 0 ? (
        <Empty
          title={t("table.no_result")}
          description={t("table.no_result_description")}
        />
      ) : <>
      <div className="text-sm text-muted-foreground mb-1">
        {t("pagination.results", {
          from: pagination.pageIndex * pagination.pageSize + 1,
          to: Math.min((pagination.pageIndex + 1) * pagination.pageSize, total),
          total,
        })}
      </div>
      <Table style={{ tableLayout: "fixed" }}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize(), position: "relative" }}>
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
                <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
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
        totalResults={total}
        pageSize={pagination.pageSize}
        showResults={false}
        onPageChange={(p) => table.setPageIndex(p - 1)}
        onPageSizeChange={(size) => {
          table.setPageSize(size);
          table.setPageIndex(0);
        }}
      />
      </>}
    </div>
  );
}
