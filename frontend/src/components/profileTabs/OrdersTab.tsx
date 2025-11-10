import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
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

export default function OrdersTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["myOrders"],
    queryFn: () => apiFetch("/checkout/my-orders"),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/checkout/${id}/cancel`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success(t("ordersPage.canceledOrder"));
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      setOpen(false);
      setSelectedOrder(null);
    },
    onError: () => toast.error(t("ordersPage.cancelError")),
  });

  if (isLoading) return <p>{t("ordersPage.loading")}</p>;
  if (!orders?.length)
    return <p className="text-gray-500">{t("ordersPage.empty")}</p>;

  return (
    <>
      <div className="space-y-4">
        {orders.map((order: any) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>
                {t("ordersPage.order")} #{order.orderNumber.slice(0, 8)}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p>
                {t("ordersPage.status")}:{" "}
                <span className="font-medium">{order.status}</span>
              </p>
              <p>
                {t("ordersPage.total")}: {order.totalPrice} €
              </p>

              <div className="mt-3 space-y-2">
                {order.items.map((i: any) => {
                  const isCanceled = i.status === "CANCELED";
                  return (
                    <div
                      key={i.id}
                      className={`text-sm flex justify-between border-b py-2 ${
                        isCanceled ? "opacity-60" : ""
                      }`}
                    >
                      <span
                        className={`${
                          isCanceled ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {i.productName}
                      </span>
                      <span
                        className={`${
                          isCanceled ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {i.quantity}× {i.unitPrice} €
                      </span>
                      {isCanceled && (
                        <span className="ml-2 text-xs font-medium text-red-600">
                          {t("ordersPage.canceled")}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {order.status === "PENDING" && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSelectedOrder(order.id);
                    setOpen(true);
                  }}
                  disabled={cancelMutation.isPending}
                >
                  {t("ordersPage.cancel")}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Confirm Cancel Dialog */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("ordersPage.confirmCancelTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("ordersPage.confirmCancelText")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedOrder(null)}>
              {t("ordersPage.cancelDelete")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (selectedOrder) cancelMutation.mutate(selectedOrder);
              }}
            >
              {t("ordersPage.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
