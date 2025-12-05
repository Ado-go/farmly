import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type {
  EventOrder,
  Order,
  OrderItem,
  OrderStatus,
} from "@/types/orders";

type CancelTarget = { id: number; type: "STANDARD" | "PREORDER" };

const statusSteps: OrderStatus[] = ["PENDING", "ONWAY", "COMPLETED"];

export default function SalesTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);

  const { data: sales, isLoading: loadingSales } = useQuery<Order[]>({
    queryKey: ["farmerOrders"],
    queryFn: () => apiFetch("/checkout/farmer-orders"),
  });

  const { data: eventSales, isLoading: loadingEventSales } =
    useQuery<EventOrder[]>({
      queryKey: ["farmerEventOrders"],
      queryFn: () => apiFetch("/checkout-preorder/farmer-orders"),
    });

  const cancelItemMutation = useMutation({
    mutationFn: (itemId: number) =>
      apiFetch(`/checkout/item/${itemId}/cancel`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success(t("salesPage.itemCanceled"));
      queryClient.invalidateQueries({ queryKey: ["farmerOrders"] });
      setCancelTarget(null);
    },
    onError: () => toast.error(t("salesPage.itemCancelError")),
  });

  const cancelPreorderItemMutation = useMutation({
    mutationFn: (itemId: number) =>
      apiFetch(`/checkout-preorder/item/${itemId}/cancel`, {
        method: "PATCH",
      }),
    onSuccess: () => {
      toast.success(t("salesPage.itemCanceled"));
      queryClient.invalidateQueries({ queryKey: ["farmerEventOrders"] });
      setCancelTarget(null);
    },
    onError: () => toast.error(t("salesPage.itemCancelError")),
  });

  const isLoading = loadingSales || loadingEventSales;
  const isCanceling =
    cancelItemMutation.isPending || cancelPreorderItemMutation.isPending;

  if (isLoading) return <p>{t("salesPage.loading")}</p>;
  if ((!sales || sales.length === 0) && (!eventSales || eventSales.length === 0))
    return <p className="text-gray-500">{t("salesPage.emptyCombined")}</p>;

  const statusLabels: Record<string, string> = {
    PENDING: t("ordersPage.statusPending"),
    ONWAY: t("ordersPage.statusOnway"),
    COMPLETED: t("ordersPage.statusCompleted"),
    CANCELED: t("ordersPage.statusCanceled"),
  };

  const handleCancel = () => {
    if (!cancelTarget) return;
    if (cancelTarget.type === "PREORDER") {
      cancelPreorderItemMutation.mutate(cancelTarget.id);
      return;
    }

    cancelItemMutation.mutate(cancelTarget.id);
  };

  return (
    <>
      <div className="space-y-8">
        <SalesSection
          title={t("salesPage.sectionStandard")}
          description={t("salesPage.sectionStandardDesc")}
          orders={sales ?? []}
          type="STANDARD"
          onCancel={setCancelTarget}
          statusLabels={statusLabels}
          isCanceling={isCanceling}
          t={t}
        />

        <SalesSection
          title={t("salesPage.sectionPreorders")}
          description={t("salesPage.sectionPreordersDesc")}
          orders={eventSales ?? []}
          type="PREORDER"
          onCancel={setCancelTarget}
          statusLabels={statusLabels}
          isCanceling={isCanceling}
          t={t}
        />
      </div>

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={() => setCancelTarget(null)}
      >
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
            <AlertDialogCancel onClick={() => setCancelTarget(null)}>
              {t("salesPage.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCancel}
              disabled={isCanceling}
            >
              {t("salesPage.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type SalesSectionProps = {
  title: string;
  description: string;
  orders: (Order | EventOrder)[];
  type: CancelTarget["type"];
  onCancel: (target: CancelTarget) => void;
  statusLabels: Record<string, string>;
  isCanceling: boolean;
  t: (key: string) => string;
};

function SalesSection({
  title,
  description,
  orders,
  type,
  onCancel,
  statusLabels,
  isCanceling,
  t,
}: SalesSectionProps) {
  if (!orders.length) return null;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          {title}
        </p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {orders.map((order) => (
          <Card
            key={order.id}
            className="border-blue-50 bg-gradient-to-br from-white via-white to-blue-50 shadow-sm"
          >
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {type === "PREORDER"
                      ? t("ordersPage.orderTypePreorder")
                      : t("ordersPage.orderTypeStandard")}
                  </p>
                  <CardTitle className="text-lg">
                    {t("salesPage.order")} #{order.orderNumber}
                  </CardTitle>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">{t("salesPage.total")}</p>
                  <p className="font-semibold text-blue-700">
                    {order.totalPrice} €
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={order.status} labels={statusLabels} />
                <PaymentBadge
                  isPaid={order.isPaid}
                  method={order.paymentMethod}
                  t={t}
                />
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <StatusProgress status={order.status} labels={statusLabels} />

              <div className="grid gap-3 md:grid-cols-2">
                <InfoGroup
                  title={
                    type === "PREORDER"
                      ? t("salesPage.pickup")
                      : t("salesPage.destination")
                  }
                  lines={getDestinationLines(order, type, t)}
                />

                <InfoGroup
                  title={t("salesPage.customer")}
                  lines={[
                    order.contact?.name ?? order.buyer?.name ?? null,
                    order.contact?.phone ?? order.buyer?.phone ?? null,
                    order.contact?.email ?? order.buyer?.email ?? null,
                  ]}
                />

                <InfoGroup
                  title={t("salesPage.payment")}
                  lines={[
                    getPaymentLabel(order.paymentMethod, t),
                    order.isPaid ? t("ordersPage.paid") : t("ordersPage.unpaid"),
                  ]}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {t("salesPage.itemsHeading")}
                </p>

                {order.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onCancel={() => onCancel({ id: item.id, type })}
                    cancelLabel={t("salesPage.cancelItem")}
                    canceledLabel={t("salesPage.canceled")}
                    isCanceling={isCanceling}
                    canCancel={
                      isCancelable(order.status) && item.status === "ACTIVE"
                    }
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ItemRow({
  item,
  onCancel,
  cancelLabel,
  canceledLabel,
  isCanceling,
  canCancel,
}: {
  item: OrderItem;
  onCancel: () => void;
  cancelLabel: string;
  canceledLabel: string;
  isCanceling: boolean;
  canCancel: boolean;
}) {
  const isCanceled = item.status === "CANCELED";

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <div>
        <p
          className={`font-medium ${
            isCanceled ? "line-through text-muted-foreground" : "text-gray-900"
          }`}
        >
          {item.productName}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.quantity}× {item.unitPrice} €
        </p>
      </div>

      {canCancel ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isCanceling}
        >
          {cancelLabel}
        </Button>
      ) : (
        isCanceled && (
          <span className="text-xs font-semibold text-red-600">
            {canceledLabel}
          </span>
        )
      )}
    </div>
  );
}

function InfoGroup({
  title,
  lines,
}: {
  title: string;
  lines: (string | null | undefined)[];
}) {
  const filtered = lines.filter(Boolean) as string[];
  if (!filtered.length) return null;

  return (
    <div className="rounded-lg bg-white/70 p-3 ring-1 ring-gray-100">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="mt-1 space-y-1 text-sm text-gray-800">
        {filtered.map((line, idx) => (
          <p key={`${line}-${idx}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  labels,
}: {
  status: OrderStatus;
  labels: Record<string, string>;
}) {
  const normalized = (status ?? "").toUpperCase();
  const colors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    ONWAY: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-emerald-100 text-emerald-800",
    CANCELED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${colors[normalized] ?? "bg-gray-100 text-gray-700"}`}
    >
      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
      {labels[normalized] ?? normalized}
    </span>
  );
}

function PaymentBadge({
  isPaid,
  method,
  t,
}: {
  isPaid?: boolean;
  method?: string;
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-50">
      <span className="h-2 w-2 rounded-full bg-emerald-300" />
      {isPaid ? t("ordersPage.paid") : t("ordersPage.unpaid")}
      <span className="text-[11px] font-normal text-slate-200">
        • {getPaymentLabel(method, t)}
      </span>
    </div>
  );
}

function StatusProgress({
  status,
  labels,
}: {
  status: OrderStatus;
  labels: Record<string, string>;
}) {
  const normalized = (status ?? "").toUpperCase();
  const currentIndex = statusSteps.indexOf(normalized);

  if (normalized === "CANCELED") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        {labels.CANCELED ?? normalized}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white/70 p-3 ring-1 ring-blue-100">
      {statusSteps.map((step, index) => {
        const active = currentIndex >= index;
        const passed = currentIndex > index;

        return (
          <div key={step} className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${active ? "bg-blue-600" : "bg-muted-foreground/30"}`}
            />
            <span
              className={`text-xs font-medium ${
                active ? "text-blue-700" : "text-muted-foreground"
              }`}
            >
              {labels[step] ?? step}
            </span>
            {index < statusSteps.length - 1 && (
              <span
                className={`h-px w-10 ${
                  passed ? "bg-blue-500" : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function getDestinationLines(
  order: Order | EventOrder,
  type: CancelTarget["type"],
  t: (key: string) => string
) {
  if (type === "PREORDER" && "event" in order) {
    const { event } = order as EventOrder;
    return [
      event?.title,
      event?.street,
      [event?.city, event?.postalCode].filter(Boolean).join(" "),
      event?.country,
    ].filter(Boolean);
  }

  const address = [
    order.delivery?.street,
    [order.delivery?.city, order.delivery?.postalCode].filter(Boolean).join(" "),
    order.delivery?.country,
  ].filter(Boolean);

  return address.length ? address : [t("ordersPage.deliveryUnknown")];
}

function isCancelable(status: OrderStatus) {
  const normalized = (status ?? "").toUpperCase();
  return normalized !== "COMPLETED" && normalized !== "CANCELED";
}

function getPaymentLabel(method: string | undefined, t: (key: string) => string) {
  if (!method) return t("ordersPage.paymentUnknown");

  const map: Record<string, string> = {
    CASH: t("ordersPage.paymentMethod.cash"),
    CARD: t("ordersPage.paymentMethod.card"),
    BANK_TRANSFER: t("ordersPage.paymentMethod.bank"),
  };

  return map[method] ?? t("ordersPage.paymentUnknown");
}
