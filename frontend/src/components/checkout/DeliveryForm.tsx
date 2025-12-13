import { type UseFormReturn } from "react-hook-form";
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
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import type { PickupLocation } from "@/lib/pickupLocations";
import type {
  AddressData,
  DeliveryOption,
} from "@/schemas/checkoutSchema";

type DeliveryFormProps = {
  form: UseFormReturn<AddressData>;
  pickupLocations: PickupLocation[];
  selectedPickupId: string;
  onPickupChange: (id: string) => void;
  onDeliveryOptionChange: (option: DeliveryOption) => void;
  onSubmit: (data: AddressData) => void;
};

export function DeliveryForm({
  form,
  pickupLocations,
  selectedPickupId,
  onPickupChange,
  onDeliveryOptionChange,
  onSubmit,
}: DeliveryFormProps) {
  const { t } = useTranslation();
  const errors = form.formState.errors;
  const deliveryOption = form.watch("deliveryOption");
  const inputTone =
    "bg-white/70 border-primary/20 focus:border-primary/50 focus-visible:ring-primary/40";

  const selectedPickup = pickupLocations.find(
    (pickup) => pickup.id === selectedPickupId
  );

  return (
    <Card className="border-primary/15 shadow-xl">
      <CardContent className="p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
            {t("checkoutPage.deliveryStep")}
          </p>
          <h2 className="text-2xl font-semibold">
            {t("checkoutPage.deliveryInfo")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("checkoutPage.selectDelivery")}
          </p>
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <FieldSet className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="contactName">
                {t("checkoutPage.name")}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="contactName"
                  placeholder={t("checkoutPage.name")}
                  {...form.register("contactName")}
                  className={inputTone}
                />
                <FieldError
                  errors={
                    errors.contactName ? [errors.contactName] : undefined
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="contactPhone">
                {t("checkoutPage.phone")}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="contactPhone"
                  placeholder="+421 900 000 000"
                  {...form.register("contactPhone")}
                  className={inputTone}
                />
                <FieldError
                  errors={
                    errors.contactPhone ? [errors.contactPhone] : undefined
                  }
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">
                {t("checkoutPage.email")}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@farmly.sk"
                  {...form.register("email")}
                  className={inputTone}
                />
                <FieldError
                  errors={errors.email ? [errors.email] : undefined}
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel>{t("checkoutPage.deliveryOption")}</FieldLabel>
              <FieldContent>
                <Select
                  value={deliveryOption}
                  onValueChange={(value) =>
                    onDeliveryOptionChange(value as DeliveryOption)
                  }
                >
                  <SelectTrigger className={inputTone}>
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
              </FieldContent>
            </Field>
          </FieldSet>

          {deliveryOption === "ADDRESS" ? (
            <FieldSet className="grid gap-5 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="deliveryStreet">
                  {t("checkoutPage.street")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="deliveryStreet"
                    placeholder={t("checkoutPage.street")}
                    {...form.register("deliveryStreet")}
                    className={inputTone}
                  />
                  <FieldError
                    errors={
                      errors.deliveryStreet ? [errors.deliveryStreet] : undefined
                    }
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="deliveryCity">
                  {t("checkoutPage.city")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="deliveryCity"
                    placeholder={t("checkoutPage.city")}
                    {...form.register("deliveryCity")}
                    className={inputTone}
                  />
                  <FieldError
                    errors={
                      errors.deliveryCity ? [errors.deliveryCity] : undefined
                    }
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="deliveryPostalCode">
                  {t("checkoutPage.postalCode")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="deliveryPostalCode"
                    placeholder="01001"
                    {...form.register("deliveryPostalCode")}
                    className={inputTone}
                  />
                  <FieldError
                    errors={
                      errors.deliveryPostalCode
                        ? [errors.deliveryPostalCode]
                        : undefined
                    }
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="deliveryCountry">
                  {t("checkoutPage.country")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="deliveryCountry"
                    placeholder={t("checkoutPage.country")}
                    {...form.register("deliveryCountry")}
                    className={inputTone}
                  />
                  <FieldError
                    errors={
                      errors.deliveryCountry
                        ? [errors.deliveryCountry]
                        : undefined
                    }
                  />
                </FieldContent>
              </Field>
            </FieldSet>
          ) : (
            <div className="space-y-4">
              <Field>
                <FieldLabel>{t("checkoutPage.pickupPoint")}</FieldLabel>
                <FieldContent>
                  <Select
                    value={selectedPickupId}
                    onValueChange={onPickupChange}
                  >
                    <SelectTrigger className={inputTone}>
                      <SelectValue
                        placeholder={t("checkoutPage.pickupPoint")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {pickupLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>

              {selectedPickup && (
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-foreground">
                  <p className="font-semibold">{selectedPickup.name}</p>
                  <p>{selectedPickup.street}</p>
                  <p>
                    {selectedPickup.postalCode} {selectedPickup.city}
                  </p>
                  <p>{selectedPickup.country}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end">
            <Button type="submit" className="min-w-[160px]">
              {t("checkoutPage.next")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
