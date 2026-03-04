import { useTranslation } from "react-i18next";
import { Trash2, ShoppingCart, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { useCartContext } from "@/contexts/cart-context";
import { PageHeader } from "@/components/ui/page-header";
import { Empty } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TextCell } from "@/components/ui/cells";

export default function Cart() {
  const { t, i18n } = useTranslation();
  const { items, isLoading, removeVariables, clearCart } = useCartContext();

  const handleExport = () => {
    const rows = items.map((item) => ({
      [t("cart.columns.variable")]: item.var_name,
      [t("cart.columns.label")]:
        i18n.language === "fr" ? item.var_label_fr : item.var_label_en,
      [t("cart.columns.table")]: item.tab_name,
      [t("cart.columns.resource")]: item.rs_name,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Variables");
    XLSX.writeFile(wb, "cart_variables.xlsx");
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
            <Empty
              title={t("cart.empty_title")}
              description={t("cart.empty_description")}
            />
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  {t("cart.item_count", { count: items.length })}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                  >
                    <Download className="size-4 mr-1" />
                    {t("cart.export")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => clearCart()}
                  >
                    <Trash2 className="size-4 mr-1" />
                    {t("cart.clear")}
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("cart.columns.variable")}</TableHead>
                    <TableHead>{t("cart.columns.label")}</TableHead>
                    <TableHead>{t("cart.columns.table")}</TableHead>
                    <TableHead>{t("cart.columns.resource")}</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <span className="font-medium">
                          <TextCell>{item.var_name}</TextCell>
                        </span>
                      </TableCell>
                      <TableCell>
                        <TextCell>
                          {i18n.language === "fr" ? item.var_label_fr : item.var_label_en}
                        </TextCell>
                      </TableCell>
                      <TableCell>
                        <TextCell>{item.tab_name}</TextCell>
                      </TableCell>
                      <TableCell>
                        <TextCell>{item.rs_name}</TextCell>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => removeVariables([item.var_id])}
                          className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                          title={t("cart.remove")}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </div>
      </div>
    </>
  );
}
