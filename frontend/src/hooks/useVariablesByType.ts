import useSWR from "swr";
import api from "@/lib/api";
import type { DictVariable } from "@/types/dict-variable";
import type { PaginatedResponse } from "@/types/paginated";

const fetcher = (url: string) =>
  api.get<PaginatedResponse<DictVariable>>(url).then((res) => res.data);

/**
 * Fetches paginated dictionary variables filtered by resource type.
 * @param type - Resource type to filter by.
 * @param params - Pagination, sorting, and filter parameters.
 * @returns `{ data, total, isLoading, error }`
 */
export function useVariablesByType(
  type: string,
  params: { pageIndex: number; pageSize: number; sortField: string; sortOrder: string; systems?: string[]; tables?: string[]; search?: string },
) {
  let url = `/catalog/variables?type=${type}&page_index=${params.pageIndex}&page_size=${params.pageSize}&sort_field=${params.sortField}&sort_order=${params.sortOrder}`;
  if (params.systems?.length) {
    url += params.systems.map((s) => `&system=${encodeURIComponent(s)}`).join("");
  }
  if (params.tables?.length) {
    url += params.tables.map((t) => `&table=${encodeURIComponent(t)}`).join("");
  }
  if (params.search) {
    url += `&search=${encodeURIComponent(params.search)}`;
  }
  const { data, error, isLoading } = useSWR(url, fetcher);

  return {
    data: data?.data ?? [],
    total: data?.total ?? 0,
    isLoading,
    error: error ? String(error) : null,
  };
}
