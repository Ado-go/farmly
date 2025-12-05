import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  PackageSearch,
  MapPin,
  Phone,
  ClipboardList,
  CalendarClock,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Order, OrderItem, OrderStatus, EventInfo } from "@/types/orders";

type LookupOrder = Order & { event?: EventInfo | null; createdAt?: string | null };

export const Route = createFileRoute("/orders")({
  component: OrdersLookupPage,
});

function OrdersLookupPage() {
  const { t } = useTranslation();
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<LookupOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusLabels = useMemo(
    () => ({
      PENDING: t("ordersPage.statusPending"),
      ONWAY: t("ordersPage.statusOnway"),
      COMPLETED: t("ordersPage.statusCompleted"),
      CANCELED: t("ordersPage.statusCanceled"),
    }),
    [t]
  );

  const lookupMutation = useMutation({
    mutationFn: (num: string) =>
      apiFetch(`/orders/${encodeURIComponent(num)}`) as Promise<LookupOrder>,
    onSuccess: (data) => {
      setOrder(data);
      setError(null);
    },
    onError: (err: Error) => {
      setOrder(null);
      const msg = err.message?.toLowerCase().includes("not found")
        ? t("orderLookup.notFound")
        : t("orderLookup.genericError");
      setError(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = orderNumber.trim();

    if (trimmed.length < 8) {
      setError(t("orderLookup.invalid"));
      setOrder(null);
      return;
    }

    lookupMutation.mutate(trimmed);
  };

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-muted/30 via-background to-background">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10">
        <Card className="border-primary/10 bg-white/95 shadow-lg">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PackageSearch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {t("orderLookup.nav")}
                </p>
                <CardTitle className="text-2xl font-semibold text-foreground">
                  {t("orderLookup.title")}
                </CardTitle>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("orderLookup.subtitle")}
            </p>
          </CardHeader>

          <CardContent>
            <form
              className="flex flex-col gap-3 md:flex-row md:items-end"
              onSubmit={handleSubmit}
            >
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {t("orderLookup.inputLabel")}
                </label>
                <Input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder={t("orderLookup.inputPlaceholder")}
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                className="h-11 min-w-[160px]"
                disabled={lookupMutation.isPending}
              >
                {lookupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("orderLookup.loading")}
                  </>
                ) : (
                  t("orderLookup.cta")
                )}
              </Button>
            </form>

            {error && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {order && (
          <OrderDetailCard order={order} statusLabels={statusLabels} t={t} />
        )}
      </div>
    </div>
  );
}

function OrderDetailCard({
  order,
  statusLabels,
  t,
}: {
  order: LookupOrder;
  statusLabels: Record<string, string>;
  t: (key: string) => string;
}) {
  const created = order.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : null;
  const isPreorder = order.orderType === "PREORDER" || !!order.event;

  const destinationLines = order.event
    ? [
        order.event.title,
        order.event.street,
        [order.event.city, order.event.postalCode].filter(Boolean).join(" "),
        order.event.country,
      ]
        .filter(Boolean)
        .map((line) => line || "")
    : [
        order.delivery?.street,
        [order.delivery?.city, order.delivery?.postalCode]
          .filter(Boolean)
          .join(" "),
        order.delivery?.country,
      ].filter(Boolean);

  return (
    <Card className="border-emerald-100 bg-white/95 shadow-lg">
      <CardHeader className="flex flex-col gap-2 border-b border-emerald-50">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("orderLookup.resultTitle")}
            </p>
            <CardTitle className="text-xl">
              {t("ordersPage.order")} #{order.orderNumber}
            </CardTitle>
            {created && (
              <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                {t("orderLookup.createdAt")}: {created}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} labels={statusLabels} />
            <PaymentBadge
              isPaid={order.isPaid}
              method={order.paymentMethod}
              t={t}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        <div className="grid gap-4 md:grid-cols-3">
          <InfoGroup
            title={t("orderLookup.orderType")}
            lines={[
              isPreorder
                ? t("ordersPage.orderTypePreorder")
                : t("ordersPage.orderTypeStandard"),
            ]}
          />
          <InfoGroup
            title={t("ordersPage.total")}
            lines={[`${(order.totalPrice ?? 0).toFixed(2)} €`]}
          />
          <InfoGroup
            title={t("ordersPage.paymentLabel")}
            lines={[
              getPaymentLabel(order.paymentMethod, t),
              order.isPaid ? t("ordersPage.paid") : t("ordersPage.unpaid"),
            ]}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InfoGroup
            title={isPreorder ? t("orderLookup.event") : t("orderLookup.delivery")}
            lines={destinationLines}
            icon={<MapPin className="h-4 w-4 text-emerald-700" />}
          />
          <InfoGroup
            title={t("orderLookup.contact")}
            lines={[
              order.contact?.name,
              order.contact?.phone,
              order.contact?.email,
            ]}
            icon={<Phone className="h-4 w-4 text-emerald-700" />}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-700" />
            <p className="text-sm font-semibold text-foreground">
              {t("orderLookup.items")}
            </p>
          </div>

          <div className="grid gap-3">
            {order.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                canceledLabel={t("ordersPage.statusCanceled")}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
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

function InfoGroup({
  title,
  lines,
  icon,
}: {
  title: string;
  lines: (string | null | undefined)[];
  icon?: ReactNode;
}) {
  const filtered = lines.filter(Boolean) as string[];
  if (!filtered.length) return null;

  return (
    <div className="rounded-lg border border-emerald-50 bg-white/80 p-3 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      <div className="space-y-1 text-sm text-gray-800 break-words">
        {filtered.map((line, idx) => (
          <p key={`${line}-${idx}`} className="break-words">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function ItemRow({
  item,
  canceledLabel,
}: {
  item: OrderItem;
  canceledLabel: string;
}) {
  const isCanceled = item.status?.toUpperCase() === "CANCELED";

  return (
    <div
      className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm ${isCanceled ? "bg-muted" : "bg-white"}`}
    >
      <div>
        <p
          className={`font-medium break-words ${
            isCanceled ? "line-through text-muted-foreground" : "text-gray-900"
          }`}
        >
          {item.productName}
        </p>
        <p className="text-xs text-muted-foreground break-words">
          {item.quantity}× {item.unitPrice} €
        </p>
      </div>

      {isCanceled && (
        <span className="text-xs font-semibold text-red-600">
          {canceledLabel}
        </span>
      )}
    </div>
  );
}

function getPaymentLabel(method: string | undefined, t: (key: string) => string) {
  if (!method) return t("ordersPage.paymentUnknown");

  const map: Record<string, string> = {
    CASH: t("ordersPage.paymentMethod.cash"),
    CARD: t("ordersPage.paymentMethod.card"),
  };

  return map[method] ?? t("ordersPage.paymentUnknown");
}
