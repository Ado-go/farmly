import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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

export default function PreordersTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["myPreorders"],
    queryFn: () => apiFetch("/checkout-preorder/my-orders"),
  });

  const cancelMutation = useMutation({
    mutationFn: (orderId: number) =>
      apiFetch(`/checkout-preorder/${orderId}/cancel`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success(t("preordersPage.canceled"));
      queryClient.invalidateQueries({ queryKey: ["myPreorders"] });
      setOpen(false);
      setSelectedOrder(null);
    },
    onError: () => toast.error(t("preordersPage.cancelError")),
  });

  if (isLoading) return <p>{t("preordersPage.loading")}</p>;
  if (!orders?.length)
    return <p className="text-gray-500">{t("preordersPage.empty")}</p>;

  return (
    <>
      <div className="space-y-4">
        {orders.map((order: any) => {
          const isOrderCanceled = order.status === "CANCELED";

          return (
            <Card
              key={order.id}
              className={isOrderCanceled ? "opacity-70 border-red-400" : ""}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>
                    {t("preordersPage.order")} #{order.orderNumber.slice(0, 8)}
                  </span>

                  {isOrderCanceled && (
                    <span className="text-xs font-semibold text-red-600 border border-red-600 px-2 py-1 rounded">
                      {t("preordersPage.orderCanceled")}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <p>
                  {t("preordersPage.event")}:{" "}
                  <span className="font-medium">{order.event?.title}</span>
                </p>

                <p>
                  {t("preordersPage.total")}: {order.totalPrice} €
                </p>

                <p>
                  {t("preordersPage.pickup")}: {order.event.street},{" "}
                  {order.event.city}
                </p>

                {/* ITEMS */}
                <div className="mt-3 border-t pt-2 space-y-2">
                  {order.items.map((i: any) => {
                    const isItemCanceled = i.status === "CANCELED";

                    return (
                      <div
                        key={i.id}
                        className={`flex justify-between text-sm items-center ${
                          isItemCanceled ? "opacity-70" : ""
                        }`}
                      >
                        <div>
                          <span
                            className={
                              isItemCanceled
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {i.productName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={
                              isItemCanceled
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {i.quantity}× {i.unitPrice} €
                          </span>

                          {isItemCanceled && (
                            <span className="text-xs text-red-600 font-semibold">
                              {t("preordersPage.canceled")}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* CANCEL WHOLE ORDER (only if pending) */}
                {!isOrderCanceled && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSelectedOrder(order.id);
                      setOpen(true);
                    }}
                  >
                    {t("preordersPage.cancel")}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* CONFIRM CANCEL */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("preordersPage.confirmCancelTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("preordersPage.confirmCancelText")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("preordersPage.cancelDelete")}
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() =>
                selectedOrder && cancelMutation.mutate(selectedOrder)
              }
            >
              {t("preordersPage.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
