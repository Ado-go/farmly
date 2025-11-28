import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart } from "@/context/CartContext";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

const addressSchema = z.object({
  contactName: z.string().min(2, "Name is required"),
  contactPhone: z
    .string()
    .min(6, "Phone number must have at least 6 digits")
    .regex(/^\+?\d{6,15}$/, "Enter a valid phone number"),
  email: z.string().email(),
  deliveryOption: z.enum(["ADDRESS", "PICKUP"]),
  deliveryCity: z.string().min(2, "City required"),
  deliveryStreet: z.string().optional(),
  deliveryRegion: z.string().min(2, "Region required"),
  deliveryPostalCode: z.string().min(2, "Postal code required"),
  deliveryCountry: z.string().min(2, "Country required"),
});

const paymentSchema = z.object({
  paymentMethod: z.enum(["CASH", "CARD"]),
});

type AddressData = z.infer<typeof addressSchema>;
type PaymentData = z.infer<typeof paymentSchema>;
type DeliveryOption = AddressData["deliveryOption"];
type PaymentMethod = PaymentData["paymentMethod"];

function CheckoutPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { cart, totalPrice, clearCart } = useCart();

  const [step, setStep] = useState(1);
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const addressForm = useForm<AddressData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      contactName: user?.name ?? "",
      contactPhone: user?.phone ?? "",
      email: "",
      deliveryOption: "ADDRESS",
      deliveryCity: "",
      deliveryStreet: "",
      deliveryRegion: "",
      deliveryPostalCode: "",
      deliveryCountry: "",
    },
  });

  const paymentForm = useForm<PaymentData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { paymentMethod: "CASH" },
  });

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
    setAddressData(null);
    setPaymentData(null);
    addressForm.reset();
    paymentForm.reset();
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
          deliveryRegion: addressData.deliveryRegion,
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
      addressForm.setValue("deliveryCity", "Banská Bystrica");
      addressForm.setValue("deliveryStreet", "Horná 54");
      addressForm.setValue("deliveryRegion", "Banskobystrický kraj");
      addressForm.setValue("deliveryPostalCode", "97401");
      addressForm.setValue("deliveryCountry", "Slovensko");
    } else {
      addressForm.reset({
        ...addressForm.getValues(),
        deliveryCity: "",
        deliveryStreet: "",
        deliveryRegion: "",
        deliveryPostalCode: "",
        deliveryCountry: "",
      });
    }
  };

  if (cart.length === 0)
    return (
      <p className="p-4 text-center text-gray-600">
        {t("checkoutPage.emptyCart")}
      </p>
    );

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <CheckoutBreadcrumb step={step} setStep={setStep} />

      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-2">
              {t("checkoutPage.deliveryInfo")}
            </h2>

            <form
              onSubmit={addressForm.handleSubmit(handleAddressSubmit)}
              className="space-y-3"
            >
              <Input
                placeholder={t("checkoutPage.name")}
                {...addressForm.register("contactName")}
              />
              <Input
                placeholder={t("checkoutPage.phone")}
                {...addressForm.register("contactPhone")}
              />
              <Input
                type="email"
                placeholder={t("checkoutPage.email")}
                {...addressForm.register("email")}
              />

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  {t("checkoutPage.deliveryOption")}
                </label>
                <Select
                  value={addressForm.watch("deliveryOption")}
                  onValueChange={handleDeliveryOptionChange}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("checkoutPage.selectDelivery")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADDRESS">
                      {t("checkoutPage.toAddress")}
                    </SelectItem>
                    <SelectItem value="PICKUP">
                      {t("checkoutPage.pickupPoint")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {addressForm.watch("deliveryOption") === "ADDRESS" ? (
                <>
                  <Input
                    placeholder={t("checkoutPage.street")}
                    {...addressForm.register("deliveryStreet")}
                  />
                  <Input
                    placeholder={t("checkoutPage.city")}
                    {...addressForm.register("deliveryCity")}
                  />
                  <Input
                    placeholder={t("checkoutPage.region")}
                    {...addressForm.register("deliveryRegion")}
                  />
                  <Input
                    placeholder={t("checkoutPage.postalCode")}
                    {...addressForm.register("deliveryPostalCode")}
                  />
                  <Input
                    placeholder={t("checkoutPage.country")}
                    {...addressForm.register("deliveryCountry")}
                  />
                </>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                  <p className="font-medium">{t("checkoutPage.pickupPoint")}</p>
                  <p>Stará tržnica</p>
                  <p>Horná 54, 97401 Banská Bystrica</p>
                  <p>Slovensko</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button type="submit">{t("checkoutPage.next")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-2">
              {t("checkoutPage.paymentMethod")}
            </h2>

            <form
              onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)}
              className="space-y-3"
            >
              <Select
                value={paymentForm.watch("paymentMethod")}
                onValueChange={(v) =>
                  paymentForm.setValue("paymentMethod", v as PaymentMethod)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("checkoutPage.selectPayment")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">{t("checkoutPage.cash")}</SelectItem>
                  <SelectItem value="CARD">{t("checkoutPage.card")}</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  {t("checkoutPage.back")}
                </Button>
                <Button type="submit">{t("checkoutPage.next")}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              {t("checkoutPage.summary")}
            </h2>

            <div className="space-y-2 text-sm text-gray-700">
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
              <p>
                <strong>{t("checkoutPage.deliveryType")}:</strong>{" "}
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

            <Separator className="my-4" />

            <h3 className="font-semibold">{t("checkoutPage.products")}</h3>
            <ul className="divide-y divide-gray-200">
              {cart.map((item, index) => (
                <li key={index} className="py-2 flex justify-between text-sm">
                  <span>
                    {item.productName} × {item.quantity}
                  </span>
                  <span>{(item.unitPrice * item.quantity).toFixed(2)} €</span>
                </li>
              ))}
            </ul>

            <Separator className="my-4" />
            <p className="text-lg font-semibold text-right">
              {t("checkoutPage.total")}: {totalPrice.toFixed(2)} €
            </p>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                {t("checkoutPage.back")}
              </Button>
              <Button disabled={loadingPayment} onClick={handleConfirmOrder}>
                {loadingPayment
                  ? "Presmerovávam..."
                  : t("checkoutPage.confirm")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CheckoutBreadcrumb({
  step,
  setStep,
}: {
  step: number;
  setStep: (s: number) => void;
}) {
  const { t } = useTranslation();

  const steps = [
    { label: t("checkoutPage.deliveryStep") },
    { label: t("checkoutPage.paymentStep") },
    { label: t("checkoutPage.summaryStep") },
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {steps.map((s, i) => (
          <BreadcrumbItem key={i}>
            <BreadcrumbLink
              onClick={() => step > i + 1 && setStep(i + 1)}
              className={`cursor-pointer ${
                step === i + 1
                  ? "text-[var(--primary)] font-semibold"
                  : step > i + 1
                    ? "text-foreground hover:text-[var(--primary)]"
                    : "text-muted-foreground cursor-default"
              }`}
            >
              {s.label}
            </BreadcrumbLink>
            {i < steps.length - 1 && <BreadcrumbSeparator />}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
