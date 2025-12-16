import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "@/context/CartContext";
import type { AddressData, PaymentData } from "@/schemas/checkoutSchema";

type OrderSummaryProps = {
  addressData: AddressData | null;
  paymentData: PaymentData | null;
  cart: CartItem[];
  totalPrice: number;
  loadingPayment?: boolean;
  submittingOrder?: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

export function OrderSummary({
  addressData,
  paymentData,
  cart,
  totalPrice,
  loadingPayment,
  submittingOrder,
  onBack,
  onConfirm,
}: OrderSummaryProps) {
  const { t } = useTranslation();
  const isConfirming = Boolean(loadingPayment || submittingOrder);
  const confirmLabel = loadingPayment
    ? t("checkoutPage.paymentStep")
    : submittingOrder
    ? t("checkoutPage.submitting")
    : t("checkoutPage.confirm");

  return (
    <Card className="border-primary/15 shadow-xl">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {t("checkoutPage.summaryStep")}
          </p>
          <h2 className="text-2xl font-semibold">
            {t("checkoutPage.summary")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("checkoutPage.confirm")}
          </p>
        </div>

        <div className="grid gap-4 rounded-xl border border-primary/10 bg-primary/5 p-4 sm:grid-cols-2">
          <div className="space-y-1 text-sm text-foreground">
            <p className="font-semibold">
              {t("checkoutPage.deliveryInfo")}
            </p>
            <p>
              <strong>{t("checkoutPage.name")}:</strong>{" "}
              {addressData?.contactName}
            </p>
            <p>
              <strong>{t("checkoutPage.phone")}:</strong>{" "}
              {addressData?.contactPhone}
            </p>
            <p>
              <strong>{t("checkoutPage.email")}:</strong> {addressData?.email}
            </p>
          </div>
          <div className="space-y-3 text-sm text-foreground">
            <div className="space-y-1">
              <p className="font-semibold">
                {t("checkoutPage.deliveryType")}
              </p>
              <p>
                <strong>{t("checkoutPage.deliveryOption")}:</strong>{" "}
                {addressData?.deliveryOption === "ADDRESS"
                  ? t("checkoutPage.toAddress")
                  : t("checkoutPage.pickupPoint")}
              </p>
              <p>
                <strong>{t("checkoutPage.paymentMethod")}:</strong>{" "}
                {paymentData?.paymentMethod === "CARD"
                  ? t("checkoutPage.card")
                  : t("checkoutPage.cash")}
              </p>
            </div>

            <div className="rounded-lg border border-primary/15 bg-white/80 px-3 py-2 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {addressData?.deliveryOption === "ADDRESS"
                  ? t("checkoutPage.deliveryInfo")
                  : t("checkoutPage.pickupPoint")}
              </p>
              <div className="mt-2 space-y-1">
                {addressData?.deliveryOption === "ADDRESS" ? (
                  <>
                    <p className="font-medium">{addressData.deliveryStreet}</p>
                    <p className="text-muted-foreground">
                      {addressData.deliveryPostalCode} {addressData.deliveryCity}
                    </p>
                    <p className="text-muted-foreground">
                      {addressData.deliveryCountry}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">
                      {addressData?.deliveryStreet}
                    </p>
                    <p className="text-muted-foreground">
                      {addressData?.deliveryPostalCode}{" "}
                      {addressData?.deliveryCity}
                    </p>
                    <p className="text-muted-foreground">
                      {addressData?.deliveryCountry}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <h3 className="font-semibold">{t("checkoutPage.products")}</h3>
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
            {t("checkoutPage.total")}: {totalPrice.toFixed(2)} €
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={onBack}>
              {t("checkoutPage.back")}
            </Button>
            <Button disabled={isConfirming} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
