import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CalendarDays, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/lib/api";

type EventInfo = {
  id: number;
  title: string;
  startDate?: string;
  endDate?: string;
  city?: string;
  region?: string;
  street?: string;
  postalCode?: string;
  country?: string;
};

export const Route = createFileRoute("/checkout-preorder")({
  component: CheckoutPreorderPage,
});

function CheckoutPreorderPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { cart, totalPrice, eventId, clearCart } = useCart();
  const [contactName, setContactName] = useState(user?.name ?? "");
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [submitting, setSubmitting] = useState(false);

  const { data: event, isLoading: isEventLoading } = useQuery<EventInfo>({
    queryKey: ["event", eventId],
    queryFn: () => apiFetch(`/public-events/${eventId}`),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (user) {
      setContactName((prev) => (prev ? prev : user.name ?? ""));
      setContactPhone((prev) => (prev ? prev : user.phone ?? ""));
      setEmail((prev) => (prev ? prev : user.email ?? ""));
    }
  }, [user]);

  const formattedEventDate = useMemo(() => {
    if (!event?.startDate) return null;

    const formatter = new Intl.DateTimeFormat(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const startDate = formatter.format(new Date(event.startDate));
    if (!event.endDate) return startDate;

    return `${startDate} – ${formatter.format(new Date(event.endDate))}`;
  }, [event?.startDate, event?.endDate]);

  const inputTone =
    "bg-white/70 border-primary/20 focus:border-primary/50 focus-visible:ring-primary/40";

  const handleConfirm = async () => {
    if (!eventId) {
      toast.error(t("cartPage.eventUnavailable"));
      return;
    }

    if (!contactName.trim()) {
      toast.error(t("checkoutPreoderPage.contactNameRequired"));
      return;
    }
    if (!contactPhone.trim()) {
      toast.error(t("checkoutPreoderPage.contactPhoneRequired"));
      return;
    }
    if (!/^\+?\d{6,15}$/.test(contactPhone.trim())) {
      toast.error(t("checkoutPreoderPage.contactPhoneInvalid"));
      return;
    }
    if (!email.trim()) {
      toast.error(t("checkoutPreoderPage.contactEmailRequired"));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error(t("checkoutPreoderPage.contactEmailInvalid"));
      return;
    }

    try {
      setSubmitting(true);
      await apiFetch("/checkout-preorder", {
        method: "POST",
        body: JSON.stringify({
          eventId,
          cartItems: cart,
          userInfo: {
            buyerId: user?.id,
            email: email.trim(),
            contactName,
            contactPhone: contactPhone.trim(),
          },
        }),
      });

      toast.success(t("checkoutPreoderPage.success"));
      clearCart();
    } catch {
      toast.error(t("checkoutPreoderPage.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0)
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-10">
          <Card className="border-amber-200/60 shadow-xl">
            <CardContent className="p-6 sm:p-10 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-semibold text-foreground">
                {t("checkoutPreoderPage.title")}
              </h1>
              <p className="text-muted-foreground">
                {t("checkoutPreoderPage.emptyCart")}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-700">
              {t("checkoutPreoderPage.title")}
            </p>
            <h1 className="text-3xl font-semibold">
              {t("cartPage.preorderHeading", {
                event: event?.title ?? t("cartPage.eventFallback"),
              })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("cartPage.preorderHint")}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            <Sparkles className="h-4 w-4" />
            <span>{t("preorder")}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          <Card className="border-amber-200/60 bg-white/95 shadow-xl">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-700">
                  {t("checkoutPreoderPage.title")}
                </p>
                <h2 className="text-2xl font-semibold">
                  {t("checkoutPreoderPage.contactHeading")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t("checkoutPreoderPage.contactHelper")}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactName">
                    {t("checkoutPreoderPage.name")}
                  </Label>
                  <Input
                    id="contactName"
                    placeholder={t("checkoutPreoderPage.name")}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className={inputTone}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">
                    {t("checkoutPreoderPage.phone")}
                  </Label>
                  <Input
                    id="contactPhone"
                    placeholder="+421 900 000 000"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className={inputTone}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">{t("checkoutPreoderPage.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@farmly.sk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputTone}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/15 bg-white/95 shadow-xl">
            <CardContent className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  {t("checkoutPreoderPage.summaryHeading")}
                </p>
                <h3 className="text-xl font-semibold">
                  {t("checkoutPreoderPage.pickupLocation")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("checkoutPreoderPage.summaryHelper")}
                </p>
              </div>

              <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t("cartPage.eventDate")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isEventLoading
                        ? t("cartPage.eventLoading")
                        : formattedEventDate ?? t("cartPage.eventUnavailable")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">
                      {event?.title ?? t("cartPage.eventFallback")}
                    </p>
                    {isEventLoading ? (
                      <p>{t("checkoutPreoderPage.loading")}</p>
                    ) : event ? (
                      <div className="space-y-0.5">
                        {event.street && <p>{event.street}</p>}
                        {(event.postalCode || event.city || event.region) && (
                          <p>
                            {[event.postalCode, event.city ?? event.region]
                              .filter(Boolean)
                              .join(" ")}
                          </p>
                        )}
                        {event.country && <p>{event.country}</p>}
                      </div>
                    ) : (
                      <p>{t("cartPage.eventUnavailable")}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">
                    {t("checkoutPreoderPage.products")}
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {t("cartPage.itemsTitle", { count: cart.length })}
                  </span>
                </div>
                <ul className="divide-y divide-gray-200 rounded-xl border">
                  {cart.map((item, index) => (
                    <li
                      key={`${item.productId}-${index}`}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {item.productName}
                        </p>
                        <p className="text-muted-foreground">
                          × {item.quantity} · {item.unitPrice.toFixed(2)} €
                        </p>
                      </div>
                      <span className="font-semibold">
                        {(item.unitPrice * item.quantity).toFixed(2)} €
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-lg font-semibold">
                  {t("checkoutPreoderPage.total")}: {totalPrice.toFixed(2)} €
                </p>
                <Button
                  className="min-w-[180px]"
                  onClick={handleConfirm}
                  disabled={submitting || isEventLoading || !eventId}
                >
                  {submitting
                    ? t("checkoutPreoderPage.loading")
                    : t("checkoutPreoderPage.confirm")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
