import useSWR from "swr";
import api from "@/utils/api";
import type { Resource } from "@/types/resource";

const fetcher = (url: string) => api.get<Resource[]>(url).then((res) => res.data);

/**
 * Fetches all resources (unpaginated).
 * @returns `{ resources, isLoading, error }`
 */
export function useResources() {
  const { data, error, isLoading } = useSWR("/resources", fetcher);

  return {
    resources: data ?? [],
    isLoading,
    error: error ? String(error) : null,
  };
}
