import useSWR from "swr";
import api from "@/lib/api";
import type { CartResponse, AddCartItemsRequest, RemoveCartItemsRequest, CartMutationResponse } from "@/types/cart";

const cartFetcher = (url: string) => api.get<CartResponse>(url).then((r) => r.data);

export function useCart() {
  const { data, error, isLoading, mutate } = useSWR("/cart/items", cartFetcher);

  const addItems = async (req: AddCartItemsRequest) => {
    const res = await api.post<CartMutationResponse>("/cart/items", req);
    await mutate();
    return res.data;
  };

  const removeItems = async (req: RemoveCartItemsRequest) => {
    const res = await api.delete<CartMutationResponse>("/cart/items", { data: req });
    await mutate();
    return res.data;
  };

  const clearCart = async () => {
    const res = await api.delete<CartMutationResponse>("/cart");
    await mutate();
    return res.data;
  };

  return {
    items: data?.items ?? [],
    count: data?.count ?? 0,
    isLoading,
    error: error?.message,
    addItems,
    removeItems,
    clearCart,
    mutate,
  };
}
