import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

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

  const { data: event } = useQuery({
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

  const handleConfirm = async () => {
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
    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim())) {
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
      <p className="p-4 text-center text-gray-600">
        {t("checkoutPreoderPage.emptyCart")}
      </p>
    );

  if (!event) return <p>{t("checkoutPreoderPage.loading")}</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">
            {t("checkoutPreoderPage.title")}
          </h2>

          <div className="space-y-3">
            <Input
              placeholder={t("checkoutPreoderPage.name")}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <Input
              placeholder={t("checkoutPreoderPage.phone")}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
            <Input
              type="email"
              placeholder={t("checkoutPreoderPage.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <p>
            <strong>{t("checkoutPreoderPage.pickupLocation")}:</strong>
            <br />
            {event.street}, {event.postalCode} {event.city}
            <br />
            {event.region}, {event.country}
          </p>

          <Separator className="my-4" />

          <h3 className="font-semibold">{t("checkoutPreoderPage.products")}</h3>

          <ul className="divide-y divide-gray-200">
            {cart.map((item, index) => (
              <li key={index} className="py-2 flex justify-between">
                <span>
                  {item.productName} × {item.quantity}
                </span>
                <span>{(item.unitPrice * item.quantity).toFixed(2)} €</span>
              </li>
            ))}
          </ul>

          <Separator className="my-4" />

          <p className="text-lg font-semibold text-right">
            {t("checkoutPreoderPage.total")}: {totalPrice.toFixed(2)} €
          </p>

          <div className="flex justify-end pt-4">
            <Button onClick={handleConfirm} disabled={submitting}>
              {t("checkoutPreoderPage.confirm")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
