import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { User } from "@/types/user";
import { useTranslation } from "react-i18next";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const registerSchema = z.object({
  name: z.string().min(2, "registerPage.name_min"),
  phone: z
    .string()
    .min(6, "registerPage.phone_min")
    .regex(/^\+?\d{6,15}$/, "registerPage.phone_invalid"),
  address: z.string().min(5, "registerPage.address_min"),
  postalCode: z.string().min(3, "registerPage.postal_min"),
  city: z.string().min(2, "registerPage.city_min"),
  country: z.string().min(2, "registerPage.country_min"),
  email: z
    .string()
    .min(1, "registerPage.email_required")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "registerPage.email_invalid"),
  password: z.string().min(6, "registerPage.password_min"),
  role: z.enum(["CUSTOMER", "FARMER"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterPage() {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "CUSTOMER" },
  });

  const registerMut = useMutation({
    mutationFn: async (values: RegisterForm) =>
      apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(values),
      }),
  });

  const loginMut = useMutation({
    mutationFn: async (values: { email: string; password: string }) =>
      apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: (data: { user: User }) => {
      setUser(data.user);
      qc.invalidateQueries({ queryKey: ["profile"] });
      navigate({ to: "/" });
    },
  });

  const onSubmit = async (values: RegisterForm) => {
    await registerMut.mutateAsync(values);
    await loginMut.mutateAsync({
      email: values.email,
      password: values.password,
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle>{t("registerPage.title")}</CardTitle>
          <CardDescription>{t("registerPage.subtitle")}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <Field>
              <Label htmlFor="name">{t("registerPage.name_label")}</Label>
              <Input
                id="name"
                placeholder={t("registerPage.name_placeholder")}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-red-500">
                  {t(errors.name.message!)}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="phone">{t("registerPage.phone_label")}</Label>
              <Input
                id="phone"
                placeholder={t("registerPage.phone_placeholder")}
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">
                  {t(errors.phone.message!)}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="address">{t("registerPage.address_label")}</Label>
              <Input
                id="address"
                placeholder={t("registerPage.address_placeholder")}
                {...register("address")}
              />
              {errors.address && (
                <p className="text-sm text-red-500">
                  {t(errors.address.message!)}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="postalCode">
                {t("registerPage.postal_label")}
              </Label>
              <Input
                id="postalCode"
                placeholder={t("registerPage.postal_placeholder")}
                {...register("postalCode")}
              />
              {errors.postalCode && (
                <p className="text-sm text-red-500">
                  {t(errors.postalCode.message!)}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="city">{t("registerPage.city_label")}</Label>
              <Input
                id="city"
                placeholder={t("registerPage.city_placeholder")}
                {...register("city")}
              />
              {errors.city && (
                <p className="text-sm text-red-500">
                  {t(errors.city.message!)}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="country">
                {t("registerPage.country_label")}
              </Label>
              <Input
                id="country"
                placeholder={t("registerPage.country_placeholder")}
                {...register("country")}
              />
              {errors.country && (
                <p className="text-sm text-red-500">
                  {t(errors.country.message!)}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="email">{t("registerPage.email_label")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("registerPage.email_placeholder")}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">
                  {t(errors.email.message!)}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="password">
                {t("registerPage.password_label")}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t("registerPage.password_placeholder")}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {t(errors.password.message!)}
                </p>
              )}
            </Field>

            <Field>
              <Label>{t("registerPage.role_label")}</Label>
              <RadioGroup
                defaultValue="CUSTOMER"
                onValueChange={(v) =>
                  setValue("role", v as "CUSTOMER" | "FARMER")
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CUSTOMER" id="customer" />
                  <Label htmlFor="customer">
                    {t("registerPage.role_customer")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FARMER" id="farmer" />
                  <Label htmlFor="farmer">
                    {t("registerPage.role_farmer")}
                  </Label>
                </div>
              </RadioGroup>
            </Field>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={registerMut.isPending || loginMut.isPending}
              className="w-full"
            >
              {registerMut.isPending || loginMut.isPending
                ? t("registerPage.loading")
                : t("registerPage.button")}
            </Button>

            {(registerMut.isError || loginMut.isError) && (
              <p className="text-sm text-red-500 mt-2">
                {(registerMut.error as Error)?.message ||
                  (loginMut.error as Error)?.message}
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
