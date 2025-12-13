import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RegistrationFormValues } from "@/types/registration";

type Translator = (key: string) => string;

interface RegistrationDetailsFormProps {
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  register: UseFormRegister<RegistrationFormValues>;
  errors: FieldErrors<RegistrationFormValues>;
  t: Translator;
  isPending: boolean;
  serverError?: string | null;
}

export function RegistrationDetailsForm({
  onSubmit,
  register,
  errors,
  t,
  isPending,
  serverError,
}: RegistrationDetailsFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-foreground">
            {t("registerPage.detailsTitle")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("registerPage.detailsDescription")}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field className="space-y-2">
          <Label htmlFor="name">{t("registerPage.nameLabel")}</Label>
          <Input
            id="name"
            placeholder={t("registerPage.namePlaceholder")}
            className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-600">{t(errors.name.message!)}</p>
          )}
        </Field>

        <Field className="space-y-2">
          <Label htmlFor="phone">{t("registerPage.phoneLabel")}</Label>
          <Input
            id="phone"
            placeholder={t("registerPage.phonePlaceholder")}
            className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-red-600">{t(errors.phone.message!)}</p>
          )}
        </Field>

        <Field className="space-y-2 sm:col-span-2">
          <Label htmlFor="email">{t("registerPage.emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("registerPage.emailPlaceholder")}
            className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{t(errors.email.message!)}</p>
          )}
        </Field>

        <Field className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">{t("registerPage.addressLabel")}</Label>
          <Input
            id="address"
            placeholder={t("registerPage.addressPlaceholder")}
            className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
            {...register("address")}
          />
          {errors.address && (
            <p className="text-xs text-red-600">{t(errors.address.message!)}</p>
          )}
        </Field>

        <Field className="space-y-2">
          <Label htmlFor="postalCode">{t("registerPage.postalLabel")}</Label>
          <Input
            id="postalCode"
            placeholder={t("registerPage.postalPlaceholder")}
            className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
            {...register("postalCode")}
          />
          {errors.postalCode && (
            <p className="text-xs text-red-600">
              {t(errors.postalCode.message!)}
            </p>
          )}
        </Field>

        <Field className="space-y-2">
          <Label htmlFor="city">{t("registerPage.cityLabel")}</Label>
          <Input
            id="city"
            placeholder={t("registerPage.cityPlaceholder")}
            className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
            {...register("city")}
          />
          {errors.city && (
            <p className="text-xs text-red-600">{t(errors.city.message!)}</p>
          )}
        </Field>

        <Field className="space-y-2">
          <Label htmlFor="country">{t("registerPage.countryLabel")}</Label>
          <Input
            id="country"
            placeholder={t("registerPage.countryPlaceholder")}
            className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
            {...register("country")}
          />
          {errors.country && (
            <p className="text-xs text-red-600">{t(errors.country.message!)}</p>
          )}
        </Field>

        <Field className="space-y-2">
          <Label htmlFor="password">{t("registerPage.passwordLabel")}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t("registerPage.passwordPlaceholder")}
            className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-red-600">
              {t(errors.password.message!)}
            </p>
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="h-11 w-full text-base shadow-md"
        >
          {isPending ? t("registerPage.loading") : t("registerPage.button")}
        </Button>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      </div>
    </form>
  );
}
