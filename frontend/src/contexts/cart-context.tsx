import { createContext, useContext, useMemo, useCallback } from "react";
import { useCart } from "@/hooks/useCart";
import type { DictVariable } from "@/types/dict-variable";
import type { CartItem } from "@/types/cart";

interface CartContextValue {
  items: CartItem[];
  count: number;
  isLoading: boolean;
  selectedVarIds: Set<number>;
  addVariables: (variables: DictVariable[]) => Promise<void>;
  removeVariables: (varIds: number[]) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const cart = useCart();

  const selectedVarIds = useMemo(
    () => new Set(cart.items.map((item) => item.var_id)),
    [cart.items],
  );

  const addVariables = useCallback(
    async (variables: DictVariable[]) => {
      await cart.addItems({
        items: variables.map((v) => ({
          var_id: v.var_id,
          var_name: v.var_name,
          var_label_en: v.var_label_en ?? "",
          var_label_fr: v.var_label_fr ?? "",
          tab_name: v.table?.tab_name ?? "",
          rs_name: v.resource?.rs_name ?? "",
        })),
      });
    },
    [cart.addItems],
  );

  const removeVariables = useCallback(
    async (varIds: number[]) => {
      await cart.removeItems({ var_ids: varIds });
    },
    [cart.removeItems],
  );

  const clearCart = useCallback(async () => {
    await cart.clearCart();
  }, [cart.clearCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: cart.items,
      count: cart.count,
      isLoading: cart.isLoading,
      selectedVarIds,
      addVariables,
      removeVariables,
      clearCart,
    }),
    [cart.items, cart.count, cart.isLoading, selectedVarIds, addVariables, removeVariables, clearCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCartContext must be used within CartProvider");
  return ctx;
}
