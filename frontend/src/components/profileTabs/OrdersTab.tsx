import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type {
  EventOrder,
  Order,
  OrderItem,
  OrderStatus,
} from "@/types/orders";

type CancelTarget = { id: number; type: "STANDARD" | "PREORDER" };
type StatusFilter = "all" | OrderStatus;

const statusSteps: OrderStatus[] = ["PENDING", "ONWAY", "COMPLETED"];
const PAGE_SIZE = 4;
const STATUS_FILTER_OPTIONS: OrderStatus[] = ["PENDING", "ONWAY", "COMPLETED", "CANCELED"];

export default function OrdersTab() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const [searchOrders, setSearchOrders] = useState("");
  const [searchPreorders, setSearchPreorders] = useState("");
  const [ordersFilter, setOrdersFilter] = useState<StatusFilter>("all");
  const [preordersFilter, setPreordersFilter] = useState<StatusFilter>("all");
  const [ordersPage, setOrdersPage] = useState(1);
  const [preordersPage, setPreordersPage] = useState(1);

  const { data: orders, isLoading: loadingOrders } = useQuery<Order[]>({
    queryKey: ["myOrders"],
    queryFn: () => apiFetch("/checkout/my-orders"),
  });

  const { data: preorders, isLoading: loadingPreorders } =
    useQuery<EventOrder[]>({
      queryKey: ["myPreorders"],
      queryFn: () => apiFetch("/checkout-preorder/my-orders"),
    });

  const cancelOrderMutation = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/checkout/${id}/cancel`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success(t("ordersPage.canceledOrder"));
      queryClient.invalidateQueries({ queryKey: ["myOrders"] });
      setCancelTarget(null);
    },
    onError: () => toast.error(t("ordersPage.cancelError")),
  });

  const cancelPreorderMutation = useMutation({
    mutationFn: (orderId: number) =>
      apiFetch(`/checkout-preorder/${orderId}/cancel`, { method: "PATCH" }),
    onSuccess: () => {
      toast.success(t("ordersPage.canceledPreorder"));
      queryClient.invalidateQueries({ queryKey: ["myPreorders"] });
      setCancelTarget(null);
    },
    onError: () => toast.error(t("ordersPage.cancelPreorderError")),
  });

  const isLoading = loadingOrders || loadingPreorders;
  const hasNoOrders =
    (!orders || orders.length === 0) && (!preorders || preorders.length === 0);

  const filteredOrders = useMemo(() => {
    const term = searchOrders.toLowerCase().trim();
    const bySearch = (orders ?? []).filter((o) =>
      o.orderNumber.toLowerCase().includes(term)
    );
    return filterByStatus(bySearch, ordersFilter);
  }, [orders, searchOrders, ordersFilter]);

  const filteredPreorders = useMemo(() => {
    const term = searchPreorders.toLowerCase().trim();
    const bySearch = (preorders ?? []).filter((o) =>
      o.orderNumber.toLowerCase().includes(term)
    );
    return filterByStatus(bySearch, preordersFilter);
  }, [preorders, searchPreorders, preordersFilter]);

  useEffect(() => setOrdersPage(1), [searchOrders]);
  useEffect(() => setPreordersPage(1), [searchPreorders]);
  useEffect(() => setOrdersPage(1), [ordersFilter]);
  useEffect(() => setPreordersPage(1), [preordersFilter]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
    setOrdersPage((p) => Math.min(p, totalPages));
  }, [filteredOrders.length]);

  useEffect(() => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredPreorders.length / PAGE_SIZE)
    );
    setPreordersPage((p) => Math.min(p, totalPages));
  }, [filteredPreorders.length]);

  const paginatedOrders = paginate(filteredOrders, ordersPage, PAGE_SIZE);
  const paginatedPreorders = paginate(filteredPreorders, preordersPage, PAGE_SIZE);

  if (isLoading) return <p>{t("ordersPage.loading")}</p>;
  if (hasNoOrders)
    return <p className="text-gray-500">{t("ordersPage.combinedEmpty")}</p>;

  const statusLabels: Record<string, string> = {
    PENDING: t("ordersPage.statusPending"),
    ONWAY: t("ordersPage.statusOnway"),
    COMPLETED: t("ordersPage.statusCompleted"),
    CANCELED: t("ordersPage.statusCanceled"),
  };

  const handleCancel = () => {
    if (!cancelTarget) return;

    if (cancelTarget.type === "PREORDER") {
      cancelPreorderMutation.mutate(cancelTarget.id);
      return;
    }

    cancelOrderMutation.mutate(cancelTarget.id);
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <OrderSection
          title={t("ordersPage.sectionOrders")}
          description={t("ordersPage.sectionOrdersDesc")}
          orders={paginatedOrders.items}
          totalCount={filteredOrders.length}
          page={ordersPage}
          onPageChange={setOrdersPage}
          type="STANDARD"
          searchTerm={searchOrders}
          onSearchChange={setSearchOrders}
          statusFilter={ordersFilter}
          onStatusFilterChange={setOrdersFilter}
          statusLabels={statusLabels}
          onCancel={setCancelTarget}
          isCanceling={
            cancelOrderMutation.isPending || cancelPreorderMutation.isPending
          }
          t={t}
        />

        <OrderSection
          title={t("ordersPage.sectionPreorders")}
          description={t("ordersPage.sectionPreordersDesc")}
          orders={paginatedPreorders.items}
          totalCount={filteredPreorders.length}
          page={preordersPage}
          onPageChange={setPreordersPage}
          type="PREORDER"
          searchTerm={searchPreorders}
          onSearchChange={setSearchPreorders}
          statusFilter={preordersFilter}
          onStatusFilterChange={setPreordersFilter}
          statusLabels={statusLabels}
          onCancel={setCancelTarget}
          isCanceling={
            cancelOrderMutation.isPending || cancelPreorderMutation.isPending
          }
          t={t}
        />
      </div>

      <AlertDialog open={!!cancelTarget} onOpenChange={() => setCancelTarget(null)}>
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
            <AlertDialogCancel onClick={() => setCancelTarget(null)}>
              {t("ordersPage.cancelDelete")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleCancel}
              disabled={
                cancelOrderMutation.isPending || cancelPreorderMutation.isPending
              }
            >
              {t("ordersPage.confirmDelete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type OrderSectionProps = {
  title: string;
  description: string;
  orders: (Order | EventOrder)[];
  totalCount: number;
  page: number;
  onPageChange: (page: number) => void;
  type: CancelTarget["type"];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (val: StatusFilter) => void;
  statusLabels: Record<string, string>;
  onCancel: (target: CancelTarget) => void;
  isCanceling: boolean;
  t: (key: string) => string;
};

function OrderSection({
  title,
  description,
  orders,
  totalCount,
  page,
  onPageChange,
  type,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  statusLabels,
  onCancel,
  isCanceling,
  t,
}: OrderSectionProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <section className="space-y-3 rounded-2xl border border-emerald-50 bg-gradient-to-br from-white to-emerald-50/40 p-4 shadow-sm">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              {title}
            </p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(val) => onStatusFilterChange(val as StatusFilter)}
            >
              <SelectTrigger className="h-9 w-[200px]">
                <SelectValue placeholder={t("ordersPage.filterByStatus")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("ordersPage.filterStatusAll")}
                </SelectItem>
                {STATUS_FILTER_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusLabels[status] ?? status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t("ordersPage.searchPlaceholder")}
              className="h-9 w-[220px]"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {orders.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-6 text-sm text-muted-foreground">
              {t("ordersPage.sectionEmpty")}
            </CardContent>
          </Card>
        )}

        {orders.map((order) => (
          <Card
            key={order.id}
            className="border-emerald-50 bg-gradient-to-br from-white via-white to-emerald-50 shadow-sm"
          >
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {type === "PREORDER"
                      ? t("ordersPage.orderTypePreorder")
                      : t("ordersPage.orderTypeStandard")}
                  </p>
                  <CardTitle className="text-lg break-words">
                    {t("ordersPage.order")} #{order.orderNumber}
                  </CardTitle>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">{t("ordersPage.total")}</p>
                  <p className="font-semibold text-emerald-700">
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
                      ? t("ordersPage.pickupTitle")
                      : t("ordersPage.deliveryTitle")
                  }
                  lines={getDestinationLines(order, type, t)}
                />

                <InfoGroup
                  title={t("ordersPage.contactTitle")}
                  lines={[
                    order.contact?.name,
                    order.contact?.phone,
                    order.contact?.email,
                  ]}
                />

                <InfoGroup
                  title={t("ordersPage.paymentLabel")}
                  lines={[
                    getPaymentLabel(order.paymentMethod, t),
                    order.isPaid ? t("ordersPage.paid") : t("ordersPage.unpaid"),
                  ]}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {t("ordersPage.items")}
                </p>

                {order.items.map((item: OrderItem) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    canceledLabel={t("ordersPage.statusCanceled")}
                  />
                ))}
              </div>

              {isCancelable(order.status) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onCancel({ id: order.id, type })}
                  disabled={isCanceling}
                >
                  {type === "PREORDER"
                    ? t("ordersPage.cancelPreorder")
                    : t("ordersPage.cancel")}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {totalCount > PAGE_SIZE && (
        <PaginationBar
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          t={t}
        />
      )}
    </section>
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

function filterByStatus<T extends { status?: OrderStatus }>(
  items: T[],
  status: StatusFilter
) {
  if (status === "all") return items;

  const target = status.toUpperCase();
  return items.filter(
    (item) => (item.status ?? "").toUpperCase() === target
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
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white/70 p-3 ring-1 ring-emerald-100">
      {statusSteps.map((step, index) => {
        const active = currentIndex >= index;
        const passed = currentIndex > index;

        return (
          <div key={step} className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-600" : "bg-muted-foreground/30"}`}
            />
            <span
              className={`text-xs font-medium ${
                active ? "text-emerald-700" : "text-muted-foreground"
              }`}
            >
              {labels[step] ?? step}
            </span>
            {index < statusSteps.length - 1 && (
              <span
                className={`h-px w-10 ${
                  passed ? "bg-emerald-500" : "bg-muted-foreground/20"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function InfoGroup({ title, lines }: { title: string; lines: (string | null | undefined)[] }) {
  const filtered = lines.filter(Boolean) as string[];
  if (!filtered.length) return null;

  return (
    <div className="rounded-lg bg-white/70 p-3 ring-1 ring-gray-100">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="mt-1 space-y-1 text-sm text-gray-800 break-words">
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
  const isCanceled = item.status === "CANCELED";

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

function isCancelable(status: OrderStatus) {
  const normalized = (status ?? "").toUpperCase();
  return normalized !== "COMPLETED" && normalized !== "CANCELED";
}

function getPaymentLabel(method: string | undefined, t: (key: string) => string) {
  if (!method) return t("ordersPage.paymentUnknown");

  const map: Record<string, string> = {
    CASH: t("ordersPage.paymentMethod.cash"),
    CARD: t("ordersPage.paymentMethod.card"),
  };

  return map[method] ?? t("ordersPage.paymentUnknown");
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize) };
}

function PaginationBar({
  page,
  totalPages,
  onPageChange,
  t,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        {t("ordersPage.page")} {page}/{totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          {t("ordersPage.prev")}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          {t("ordersPage.next")}
        </Button>
      </div>
    </div>
  );
}
