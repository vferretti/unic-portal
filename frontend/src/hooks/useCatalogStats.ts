import useSWR from "swr";
import api from "@/lib/api";

/** Aggregate counts for a single resource type. */
export interface CatalogTypeStat {
  resource_count: number;
  table_count: number;
  variable_count: number;
}

/** Map of resource type to its aggregate catalog statistics. */
export type CatalogStats = Record<string, CatalogTypeStat>;

const fetcher = (url: string) =>
  api.get<CatalogStats>(url).then((res) => res.data);

/**
 * Fetches aggregate catalog statistics (resource/table/variable counts) grouped by type.
 * @param systems - Optional source system names to filter by.
 * @param tables - Optional table names to filter by.
 * @returns `{ stats, isLoading, error }`
 */
export function useCatalogStats(systems?: string[], tables?: string[]) {
  let url = "/catalog/stats";
  const params: string[] = [];
  if (systems?.length) {
    params.push(...systems.map((s) => `system=${encodeURIComponent(s)}`));
  }
  if (tables?.length) {
    params.push(...tables.map((t) => `table=${encodeURIComponent(t)}`));
  }
  if (params.length) {
    url += "?" + params.join("&");
  }
  const { data, error, isLoading } = useSWR(url, fetcher);
  return {
    stats: data ?? {},
    isLoading,
    error: error ? String(error) : null,
  };
}
