import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/checkout-preorder")({
  component: CheckoutPreorderPage,
});

function CheckoutPreorderPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { cart, totalPrice, eventId, clearCart } = useCart();

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => apiFetch(`/public-events/${eventId}`),
    enabled: !!eventId,
  });

  const handleConfirm = async () => {
    try {
      await apiFetch("/checkout-preorder", {
        method: "POST",
        body: JSON.stringify({
          eventId,
          cartItems: cart,
          userInfo: {
            buyerId: user?.id,
            email: user?.email,
          },
        }),
      });

      toast.success(t("checkoutPreoderPage.success"));
      clearCart();
    } catch (err) {
      toast.error(t("checkoutPreoderPage.error"));
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
            <Button onClick={handleConfirm}>
              {t("checkoutPreoderPage.confirm")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
