import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import {
  CalendarDays,
  MapPin,
  Package,
  ShoppingBasket,
  Sparkles,
  X,
  ShoppingCart,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type EventInfo = {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  city?: string;
  region?: string;
};

export const Route = createFileRoute("/cart")({
  component: CartPage,
});

function CartPage() {
  const {
    cart,
    removeFromCart,
    totalPrice,
    clearCart,
    cartType,
    updateQuantity,
    eventId,
  } = useCart();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isPreorder = cartType === "PREORDER";

  const { data: event, isLoading: isEventLoading } = useQuery<EventInfo>({
    queryKey: ["cart-event", eventId],
    queryFn: () => apiFetch(`/public-events/${eventId}`),
    enabled: isPreorder && !!eventId,
  });

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-dashed bg-gradient-to-br from-muted/40 via-white to-white">
          <CardContent className="p-10 text-center space-y-6">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShoppingCart className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {t("cartPage.yourCart")}
              </h2>
              <p className="text-muted-foreground">
                {t("cartPage.emptyCart")}
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() =>
                  navigate({
                    to: "/products",
                    search: {
                      page: 1,
                      sort: "newest",
                      category: undefined,
                      order: "desc",
                      search: undefined,
                    },
                  })
                }
              >
                {t("products")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const goToCheckout = () => {
    if (cartType === "PREORDER") {
      navigate({ to: "/checkout-preorder" });
    } else {
      navigate({ to: "/checkout" });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              isPreorder
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {isPreorder ? (
              <Sparkles className="h-4 w-4" />
            ) : (
              <ShoppingBasket className="h-4 w-4" />
            )}
            <span>
              {isPreorder ? t("cartPage.preorder") : t("cartPage.standardHeading")}
            </span>
          </div>
          <h1 className="text-3xl font-bold">{t("cartPage.yourCart")}</h1>
          <p className="text-sm text-muted-foreground">
            {isPreorder
              ? t("cartPage.preorderHint")
              : t("cartPage.standardHint")}
          </p>
        </div>
      </div>

      {isPreorder ? (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 via-white to-white">
          <CardHeader className="gap-2">
            <CardTitle className="text-xl">
              {t("cartPage.preorderHeading", {
                event: event?.title ?? t("cartPage.eventFallback"),
              })}
            </CardTitle>
            <CardDescription>{t("cartPage.preorderHint")}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3 text-sm">
              <CalendarDays className="h-5 w-5 text-amber-700" />
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">
                  {t("cartPage.eventDate")}
                </p>
                <p className="text-muted-foreground">
                  {isEventLoading
                    ? t("cartPage.eventLoading")
                    : event
                    ? `${new Date(event.startDate).toLocaleDateString()} – ${new Date(
                        event.endDate
                      ).toLocaleDateString()}`
                    : t("cartPage.eventUnavailable")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <MapPin className="h-5 w-5 text-amber-700" />
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground">
                  {t("cartPage.eventLocation")}
                </p>
                <p className="text-muted-foreground">
                  {event?.city || event?.region
                    ? [event?.city, event?.region].filter(Boolean).join(", ")
                    : isEventLoading
                    ? t("cartPage.eventLoading")
                    : t("cartPage.eventUnavailable")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-white">
          <CardHeader>
            <CardTitle className="text-xl">
              {t("cartPage.standardHeading")}
            </CardTitle>
            <CardDescription>{t("cartPage.standardHint")}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="h-full">
          <CardHeader className="border-b pb-4">
            <CardTitle>
              {t("cartPage.itemsTitle", { count: cart.length })}
            </CardTitle>
            <CardDescription>{t("cartPage.itemsSubtitle")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.productId}
                className="rounded-lg border border-muted/50 bg-muted/30 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">
                      {item.productName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.sellerName}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="self-start text-destructive"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">{t("cartPage.remove")}</span>
                  </Button>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("cartPage.quantity")}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      className="h-10 w-24"
                      onChange={(e) => {
                        const value = e.target.valueAsNumber;
                        if (Number.isNaN(value)) return;
                        updateQuantity(item.productId, value);
                      }}
                    />
                    <p className="text-sm text-muted-foreground">
                      {t("cartPage.unitPrice")}: {item.unitPrice.toFixed(2)} €
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {t("cartPage.lineTotal")}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {(item.unitPrice * item.quantity).toFixed(2)} €
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="h-full bg-white/95">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <CardTitle>{t("cartPage.summaryTitle")}</CardTitle>
            </div>
            <CardDescription>
              {isPreorder
                ? t("cartPage.preorderSummary")
                : t("cartPage.standardSummary")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("cartPage.itemsTitle", { count: cart.length })}</span>
              <span>{cart.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("cartPage.orderTypeLabel")}</span>
              <span className="font-medium text-foreground">
                {isPreorder
                  ? t("cartPage.preorder")
                  : t("cartPage.standardOrderShort")}
              </span>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4 border-t pt-4">
            <div className="flex w-full items-center justify-between text-xl font-semibold">
              <span>{t("cartPage.total")}</span>
              <span>{totalPrice.toFixed(2)} €</span>
            </div>
            <div className="flex w-full gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={clearCart}
              >
                {t("cartPage.clear")}
              </Button>
              <Button className="flex-1" onClick={goToCheckout}>
                {isPreorder
                  ? t("cartPage.continuePreorder")
                  : t("cartPage.continueCheckout")}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
