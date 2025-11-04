import { createFileRoute } from "@tanstack/react-router";
import { useCart } from "@/context/CartContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

const checkoutSchema = z.object({
  email: z.string().email("checkoutPage.invalidEmail"),
  deliveryCity: z.string().min(2, "checkoutPage.requiredCity"),
  deliveryStreet: z.string().min(2, "checkoutPage.requiredStreet"),
  deliveryRegion: z.string().min(2, "checkoutPage.requiredRegion"),
  deliveryPostalCode: z.string().min(2, "checkoutPage.requiredPostalCode"),
  deliveryCountry: z.string().min(2, "checkoutPage.requiredCountry"),
  paymentMethod: z.enum(["CASH", "CARD", "BANK_TRANSFER"]),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

function CheckoutPage() {
  const { t } = useTranslation();
  const { cart, totalPrice, clearCart } = useCart();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: "",
      deliveryCity: "",
      deliveryStreet: "",
      deliveryRegion: "",
      deliveryPostalCode: "",
      deliveryCountry: "",
      paymentMethod: "CASH",
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      const payload = { cartItems: cart, userInfo: data };
      const res = await apiFetch("/checkout", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      toast.success(t("checkoutPage.success"));
      clearCart();
      form.reset();
    } catch (err: any) {
      console.error(err);
      toast.error(t("checkoutPage.error"));
    }
  };

  if (cart.length === 0)
    return (
      <p className="p-4 text-center text-gray-600">
        {t("checkoutPage.emptyCart")}
      </p>
    );

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{t("checkoutPage.title")}</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <Input
          type="email"
          placeholder={t("checkoutPage.email")}
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-red-500 text-sm">
            {t(form.formState.errors.email.message!)}
          </p>
        )}

        <Input
          placeholder={t("checkoutPage.city")}
          {...form.register("deliveryCity")}
        />
        {form.formState.errors.deliveryCity && (
          <p className="text-red-500 text-sm">
            {t(form.formState.errors.deliveryCity.message!)}
          </p>
        )}

        <Input
          placeholder={t("checkoutPage.street")}
          {...form.register("deliveryStreet")}
        />
        {form.formState.errors.deliveryStreet && (
          <p className="text-red-500 text-sm">
            {t(form.formState.errors.deliveryStreet.message!)}
          </p>
        )}

        <Input
          placeholder={t("checkoutPage.region")}
          {...form.register("deliveryRegion")}
        />
        {form.formState.errors.deliveryRegion && (
          <p className="text-red-500 text-sm">
            {t(form.formState.errors.deliveryRegion.message!)}
          </p>
        )}

        <Input
          placeholder={t("checkoutPage.postalCode")}
          {...form.register("deliveryPostalCode")}
        />
        {form.formState.errors.deliveryPostalCode && (
          <p className="text-red-500 text-sm">
            {t(form.formState.errors.deliveryPostalCode.message!)}
          </p>
        )}

        <Input
          placeholder={t("checkoutPage.country")}
          {...form.register("deliveryCountry")}
        />
        {form.formState.errors.deliveryCountry && (
          <p className="text-red-500 text-sm">
            {t(form.formState.errors.deliveryCountry.message!)}
          </p>
        )}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
            {t("checkoutPage.paymentMethod")}
          </label>
          <Select
            onValueChange={(value) =>
              form.setValue(
                "paymentMethod",
                value as "CASH" | "CARD" | "BANK_TRANSFER"
              )
            }
            value={form.watch("paymentMethod")}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("checkoutPage.selectPayment")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">{t("checkoutPage.cash")}</SelectItem>
              <SelectItem value="CARD">{t("checkoutPage.card")}</SelectItem>
              <SelectItem value="BANK_TRANSFER">
                {t("checkoutPage.bankTransfer")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-between items-center mt-6">
          <p className="text-lg font-semibold">
            {t("checkoutPage.total")}: {totalPrice.toFixed(2)} €
          </p>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting
              ? t("checkoutPage.submitting")
              : t("checkoutPage.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
