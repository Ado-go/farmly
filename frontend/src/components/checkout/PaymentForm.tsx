import { type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import type {
  PaymentData,
  PaymentMethod,
} from "@/schemas/checkoutSchema";

type PaymentFormProps = {
  form: UseFormReturn<PaymentData>;
  onSubmit: (data: PaymentData) => void;
  onBack: () => void;
};

export function PaymentForm({ form, onSubmit, onBack }: PaymentFormProps) {
  const { t } = useTranslation();
  const errors = form.formState.errors;
  const paymentMethod = form.watch("paymentMethod");
  const selectTone =
    "bg-white/70 border-primary/20 focus:border-primary/50 focus-visible:ring-primary/40";

  return (
    <Card className="border-primary/15 shadow-xl">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {t("checkoutPage.paymentStep")}
          </p>
          <h2 className="text-2xl font-semibold">
            {t("checkoutPage.paymentMethod")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("checkoutPage.selectPayment")}
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <Field>
            <FieldLabel>{t("checkoutPage.paymentMethod")}</FieldLabel>
            <FieldContent>
              <Select
                value={paymentMethod}
                onValueChange={(v) =>
                  form.setValue("paymentMethod", v as PaymentMethod)
                }
              >
                <SelectTrigger className={selectTone}>
                  <SelectValue placeholder={t("checkoutPage.selectPayment")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">
                    {t("checkoutPage.cash")}
                  </SelectItem>
                  <SelectItem value="CARD">
                    {t("checkoutPage.card")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={errors.paymentMethod ? [errors.paymentMethod] : undefined} />
            </FieldContent>
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button variant="outline" onClick={onBack} type="button">
              {t("checkoutPage.back")}
            </Button>
            <Button type="submit" className="min-w-[160px]">
              {t("checkoutPage.next")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
