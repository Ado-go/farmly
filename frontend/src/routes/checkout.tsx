import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/lib/api";
import { pickupLocations } from "@/lib/pickupLocations";
import { CheckoutProgress } from "@/components/checkout/CheckoutProgress";
import { DeliveryForm } from "@/components/checkout/DeliveryForm";
import { PaymentForm } from "@/components/checkout/PaymentForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import {
  addressSchema,
  paymentSchema,
  type AddressData,
  type DeliveryOption,
  type PaymentData,
} from "@/types/checkout";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { cart, totalPrice, clearCart } = useCart();

  const [step, setStep] = useState(1);
  const [selectedPickupId, setSelectedPickupId] = useState(
    pickupLocations[0]?.id ?? ""
  );
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const addressForm = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      contactName: user?.name ?? "",
      contactPhone: user?.phone ?? "",
      email: user?.email ?? "",
      deliveryOption: "ADDRESS",
      deliveryCity: user?.city ?? "",
      deliveryStreet: user?.address ?? "",
      deliveryPostalCode: user?.postalCode ?? "",
      deliveryCountry: user?.country ?? "",
    },
  });

  const paymentForm = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentMethod: "CASH" },
  });

  const steps = useMemo(
    () => [
      {
        label: t("checkoutPage.deliveryStep"),
        helper: t("checkoutPage.deliveryInfo"),
      },
      {
        label: t("checkoutPage.paymentStep"),
        helper: t("checkoutPage.paymentMethod"),
      },
      {
        label: t("checkoutPage.summaryStep"),
        helper: t("checkoutPage.summary"),
      },
    ],
    [t]
  );

  const applyPickupLocation = (locationId: string) => {
    const location = pickupLocations.find((p) => p.id === locationId);
    if (!location) return;

    setSelectedPickupId(location.id);
    addressForm.setValue("deliveryCity", location.city);
    addressForm.setValue("deliveryStreet", location.street);
    addressForm.setValue("deliveryPostalCode", location.postalCode);
    addressForm.setValue("deliveryCountry", location.country);
  };

  const handleAddressSubmit = (data: AddressData) => {
    setAddressData(data);
    setStep(2);
  };

  const handlePaymentSubmit = (data: PaymentData) => {
    setPaymentData(data);
    setStep(3);
  };

  const cleanupCheckout = () => {
    clearCart();
    setStep(1);
    setSelectedPickupId(pickupLocations[0]?.id ?? "");
    setAddressData(null);
    setPaymentData(null);
    addressForm.reset();
    paymentForm.reset({ paymentMethod: "CASH" });
  };

  useEffect(() => {
    if (user) {
      if (!addressForm.getValues("contactName")) {
        addressForm.setValue("contactName", user.name ?? "");
      }
      if (!addressForm.getValues("contactPhone")) {
        addressForm.setValue("contactPhone", user.phone ?? "");
      }
      if (!addressForm.getValues("email")) {
        addressForm.setValue("email", user.email ?? "");
      }
      if (!addressForm.getValues("deliveryStreet")) {
        addressForm.setValue("deliveryStreet", user.address ?? "");
      }
      if (!addressForm.getValues("deliveryCity")) {
        addressForm.setValue("deliveryCity", user.city ?? "");
      }
      if (!addressForm.getValues("deliveryPostalCode")) {
        addressForm.setValue("deliveryPostalCode", user.postalCode ?? "");
      }
      if (!addressForm.getValues("deliveryCountry")) {
        addressForm.setValue("deliveryCountry", user.country ?? "");
      }
    }
  }, [user, addressForm]);

  const handleConfirmOrder = async () => {
    if (!addressData || !paymentData) return;

    try {
      const payload = {
        cartItems: cart,
        userInfo: {
          buyerId: user?.id,
          contactName: addressData.contactName,
          contactPhone: addressData.contactPhone,
          email: addressData.email,
          deliveryCity: addressData.deliveryCity,
          deliveryStreet: addressData.deliveryStreet || "-",
          deliveryPostalCode: addressData.deliveryPostalCode,
          deliveryCountry: addressData.deliveryCountry,
          paymentMethod: paymentData.paymentMethod,
        },
      };

      if (paymentData.paymentMethod === "CARD") {
        try {
          setLoadingPayment(true);

          const orderRes = await apiFetch("/checkout", {
            method: "POST",
            body: JSON.stringify(payload),
          });

          const { orderId } = orderRes;

          setTimeout(() => {
            cleanupCheckout();
          }, 0);

          const paymentRes = await apiFetch(
            "/checkout/create-payment-session",
            {
              method: "POST",
              body: JSON.stringify({ orderId }),
            }
          );

          window.location.href = paymentRes.url;
        } finally {
          setLoadingPayment(false);
        }
        return;
      }

      await apiFetch("/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(t("checkoutPage.success"));
      cleanupCheckout();
    } catch (err) {
      console.error(err);
      toast.error(t("checkoutPage.error"));
    }
  };

  const handleDeliveryOptionChange = (value: DeliveryOption) => {
    addressForm.setValue("deliveryOption", value);

    if (value === "PICKUP") {
      const fallbackPickupId = selectedPickupId || pickupLocations[0]?.id || "";

      if (fallbackPickupId) {
        applyPickupLocation(fallbackPickupId);
      }

      return;
    }

    addressForm.reset({
      ...addressForm.getValues(),
      deliveryOption: "ADDRESS",
      deliveryCity: user?.city ?? "",
      deliveryStreet: user?.address ?? "",
      deliveryPostalCode: user?.postalCode ?? "",
      deliveryCountry: user?.country ?? "",
    });
  };

  if (cart.length === 0)
    return (
      <main className="relative min-h-screen bg-gradient-to-b from-primary/10 via-white to-emerald-50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.12),transparent_32%)]" />
        <div className="relative mx-auto max-w-3xl px-4 py-10">
          <Card className="border-primary/15 shadow-xl">
            <CardContent className="p-6 sm:p-10 text-center space-y-4">
              <h1 className="text-2xl font-semibold text-primary">
                {t("checkoutPage.title")}
              </h1>
              <p className="text-muted-foreground">
                {t("checkoutPage.emptyCart")}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-primary/10 via-white to-emerald-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.12),transparent_32%)]" />
      <div className="relative mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
            {t("checkoutPage.title")}
          </p>
          <h1 className="text-3xl font-semibold">
            {t("checkoutPage.summaryStep")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("checkoutPage.deliveryInfo")}
          </p>
        </div>

        <CheckoutProgress step={step} steps={steps} onStepChange={setStep} />

        {step === 1 && (
          <DeliveryForm
            form={addressForm}
            pickupLocations={pickupLocations}
            selectedPickupId={selectedPickupId}
            onPickupChange={applyPickupLocation}
            onDeliveryOptionChange={handleDeliveryOptionChange}
            onSubmit={handleAddressSubmit}
          />
        )}

        {step === 2 && (
          <PaymentForm
            form={paymentForm}
            onSubmit={handlePaymentSubmit}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <OrderSummary
            addressData={addressData}
            paymentData={paymentData}
            cart={cart}
            totalPrice={totalPrice}
            loadingPayment={loadingPayment}
            onBack={() => setStep(2)}
            onConfirm={handleConfirmOrder}
          />
        )}
      </div>
    </main>
  );
}
