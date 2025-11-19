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
import type { EventOrder, OrderItem } from "@/types/orders";

export default function EventSalesTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);

  const { data: orders, isLoading } = useQuery<EventOrder[]>({
    queryKey: ["myPreorders"],
    queryFn: () => apiFetch("/checkout-preorder/farmer-orders"),
  });

  const cancelMutation = useMutation({
    mutationFn: (itemId: number) =>
      apiFetch(`/checkout-preorder/item/${itemId}/cancel`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success(t("preordersPage.itemCanceled"));
      queryClient.invalidateQueries({ queryKey: ["myPreorders"] });
      setOpen(false);
      setSelectedItem(null);
    },
    onError: () => toast.error(t("preordersPage.itemCancelError")),
  });

  if (isLoading) return <p>{t("preordersPage.loading")}</p>;
  if (!orders?.length)
    return <p className="text-gray-500">{t("preordersPage.empty")}</p>;

  return (
    <>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>
                {t("preordersPage.order")} #{order.orderNumber.slice(0, 8)}
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
                {order.items.map((i: OrderItem) => {
                  const isCanceled = i.status === "CANCELED";

                  return (
                    <div
                      key={i.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <p
                          className={
                            isCanceled
                              ? "line-through text-muted-foreground"
                              : "font-medium"
                          }
                        >
                          {i.productName}
                        </p>
                        <p
                          className={
                            isCanceled
                              ? "line-through text-muted-foreground text-xs"
                              : "text-gray-500 text-xs"
                          }
                        >
                          {i.quantity}× {i.unitPrice} €
                        </p>
                      </div>

                      {/* CANCEL BUTTON */}
                      {!isCanceled && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={cancelMutation.isPending}
                          onClick={() => {
                            setSelectedItem(i.id);
                            setOpen(true);
                          }}
                        >
                          {t("preordersPage.cancelItem")}
                        </Button>
                      )}

                      {/* STATUS BADGE */}
                      {isCanceled && (
                        <span className="text-xs font-medium text-red-600">
                          {t("preordersPage.canceled")}
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

      {/* CONFIRM CANCEL MODAL */}
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
            <AlertDialogCancel onClick={() => setSelectedItem(null)}>
              {t("preordersPage.cancelDelete")}
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedItem) cancelMutation.mutate(selectedItem);
              }}
            >
              {t("preordersPage.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
