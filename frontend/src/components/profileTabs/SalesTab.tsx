import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { OrderItem, Order } from "@/types/orders";

export default function SalesTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);

  const { data: sales, isLoading } = useQuery<Order[]>({
    queryKey: ["farmerOrders"],
    queryFn: () => apiFetch("/checkout/farmer-orders"),
  });

  const cancelItemMutation = useMutation({
    mutationFn: (itemId: number) =>
      apiFetch(`/checkout/item/${itemId}/cancel`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success(t("salesPage.itemCanceled"));
      queryClient.invalidateQueries({ queryKey: ["farmerOrders"] });
      setOpen(false);
      setSelectedItem(null);
    },
    onError: () => toast.error(t("salesPage.itemCancelError")),
  });

  if (isLoading) return <p>{t("salesPage.loading")}</p>;
  if (!sales?.length)
    return <p className="text-gray-500">{t("salesPage.empty")}</p>;

  return (
    <>
      <div className="space-y-4">
        {sales.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>
                {t("salesPage.order")} #{order.orderNumber.slice(0, 8)}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p>
                {t("salesPage.status")}:{" "}
                <span className="font-medium">{order.status}</span>
              </p>
              <p>
                {t("salesPage.buyer")}:{" "}
                {order.buyer?.id
                  ? `#${order.buyer.id}`
                  : (order.buyer?.email ?? "-")}
              </p>

              <div className="mt-4 space-y-2">
                {order.items.map((i) => {
                  const isCanceled = i.status === "CANCELED";
                  return (
                    <div
                      key={i.id}
                      className={`flex items-center justify-between border-b py-2 ${
                        isCanceled ? "opacity-60" : ""
                      }`}
                    >
                      <div>
                        <p
                          className={`font-medium ${
                            isCanceled
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {i.productName}
                        </p>
                        <p
                          className={`text-sm ${
                            isCanceled
                              ? "line-through text-muted-foreground"
                              : "text-gray-500"
                          }`}
                        >
                          {i.quantity}× {i.unitPrice} €
                        </p>
                      </div>

                      {i.status === "ACTIVE" && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={cancelItemMutation.isPending}
                          onClick={() => {
                            setSelectedItem(i);
                            setOpen(true);
                          }}
                        >
                          {t("salesPage.cancelItem")}
                        </Button>
                      )}

                      {isCanceled && (
                        <span className="text-xs font-medium text-red-600">
                          {t("salesPage.canceled")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("salesPage.confirmCancelTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("salesPage.confirmCancelText")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedItem(null)}>
              {t("salesPage.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedItem) cancelItemMutation.mutate(selectedItem.id);
              }}
            >
              {t("salesPage.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
