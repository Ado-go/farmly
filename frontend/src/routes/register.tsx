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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { Leaf, ShieldCheck, ShoppingBasket, Tractor } from "lucide-react";

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
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "CUSTOMER" },
  });

  const selectedRole = watch("role");

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
    <div className="relative min-h-screen bg-gradient-to-br from-primary/10 via-white to-emerald-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(76,175,80,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(245,166,35,0.15),transparent_30%)]" />

      <div className="relative mx-auto max-w-5xl px-4 py-10">
        <Card className="w-full overflow-hidden border-primary/15 bg-white/95 shadow-2xl backdrop-blur">
          <div className="grid items-stretch md:grid-cols-[1.05fr_0.95fr] md:min-h-[680px]">
            <div className="relative hidden h-full overflow-hidden text-primary-foreground md:flex">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-emerald-500" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_32%)]" />

              <div className="relative flex h-full flex-col gap-6 p-10">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white/15 p-3">
                    <Leaf className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                      Farmly
                    </p>
                    <p className="text-lg font-semibold text-primary-foreground">
                      {t("registerPage.hero_heading")}
                    </p>
                  </div>
                </div>

                <p className="max-w-md text-sm text-primary-foreground/90">
                  {t("registerPage.hero_description")}
                </p>

                <div className="grid gap-3">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/70">
                    {t("registerPage.hero_bullets_title")}
                  </p>
                  {[
                    {
                      icon: ShoppingBasket,
                      title: t("registerPage.highlight_shop"),
                      desc: t("registerPage.highlight_shop_desc"),
                    },
                    {
                      icon: Tractor,
                      title: t("registerPage.highlight_grow"),
                      desc: t("registerPage.highlight_grow_desc"),
                    },
                    {
                      icon: ShieldCheck,
                      title: t("registerPage.highlight_trust"),
                      desc: t("registerPage.highlight_trust_desc"),
                    },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur"
                    >
                      <item.icon className="mt-0.5 h-5 w-5 text-white" />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-primary-foreground">
                          {item.title}
                        </p>
                        <p className="text-xs text-primary-foreground/80">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative flex h-full flex-col p-6 sm:p-10">
              <CardHeader className="space-y-3 p-0">
                <CardTitle className="flex items-center gap-2 text-3xl">
                  {t("registerPage.title")}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {t("registerPage.subtitle")}
                </CardDescription>
              </CardHeader>

              <div className="mt-6 space-y-6">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.25em] text-primary/80">
                        {t("registerPage.role_label")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("registerPage.role_step_description")}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-foreground shadow-sm">
                      {selectedRole === "FARMER"
                        ? t("registerPage.role_farmer")
                        : t("registerPage.role_customer")}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        value: "CUSTOMER" as const,
                        title: t("registerPage.role_customer"),
                        description: t("registerPage.role_customer_desc"),
                        icon: ShoppingBasket,
                      },
                      {
                        value: "FARMER" as const,
                        title: t("registerPage.role_farmer"),
                        description: t("registerPage.role_farmer_desc"),
                        icon: Tractor,
                      },
                    ].map((roleCard) => {
                      const Icon = roleCard.icon;
                      const active = selectedRole === roleCard.value;

                      return (
                        <button
                          key={roleCard.value}
                          type="button"
                          onClick={() =>
                            setValue("role", roleCard.value, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                          }
                          className={cn(
                            "group flex h-full flex-col gap-3 rounded-xl border bg-white px-4 pb-3 pt-4 text-left transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                            active
                              ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/30"
                              : "border-primary/15"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "rounded-full p-2 transition",
                                active
                                  ? "bg-primary text-primary-foreground shadow-md"
                                  : "bg-primary/10 text-primary"
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-foreground">
                                {roleCard.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {roleCard.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {t("registerPage.details_title")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("registerPage.details_description")}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field className="space-y-2">
                      <Label htmlFor="name">
                        {t("registerPage.name_label")}
                      </Label>
                      <Input
                        id="name"
                        placeholder={t("registerPage.name_placeholder")}
                        className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
                        {...register("name")}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-600">
                          {t(errors.name.message!)}
                        </p>
                      )}
                    </Field>

                    <Field className="space-y-2">
                      <Label htmlFor="phone">
                        {t("registerPage.phone_label")}
                      </Label>
                      <Input
                        id="phone"
                        placeholder={t("registerPage.phone_placeholder")}
                        className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
                        {...register("phone")}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-600">
                          {t(errors.phone.message!)}
                        </p>
                      )}
                    </Field>

                    <Field className="space-y-2 sm:col-span-2">
                      <Label htmlFor="email">
                        {t("registerPage.email_label")}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("registerPage.email_placeholder")}
                        className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-600">
                          {t(errors.email.message!)}
                        </p>
                      )}
                    </Field>

                    <Field className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address">
                        {t("registerPage.address_label")}
                      </Label>
                      <Input
                        id="address"
                        placeholder={t("registerPage.address_placeholder")}
                        className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
                        {...register("address")}
                      />
                      {errors.address && (
                        <p className="text-xs text-red-600">
                          {t(errors.address.message!)}
                        </p>
                      )}
                    </Field>

                    <Field className="space-y-2">
                      <Label htmlFor="postalCode">
                        {t("registerPage.postal_label")}
                      </Label>
                      <Input
                        id="postalCode"
                        placeholder={t("registerPage.postal_placeholder")}
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
                      <Label htmlFor="city">
                        {t("registerPage.city_label")}
                      </Label>
                      <Input
                        id="city"
                        placeholder={t("registerPage.city_placeholder")}
                        className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
                        {...register("city")}
                      />
                      {errors.city && (
                        <p className="text-xs text-red-600">
                          {t(errors.city.message!)}
                        </p>
                      )}
                    </Field>

                    <Field className="space-y-2">
                      <Label htmlFor="country">
                        {t("registerPage.country_label")}
                      </Label>
                      <Input
                        id="country"
                        placeholder={t("registerPage.country_placeholder")}
                        className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
                        {...register("country")}
                      />
                      {errors.country && (
                        <p className="text-xs text-red-600">
                          {t(errors.country.message!)}
                        </p>
                      )}
                    </Field>

                    <Field className="space-y-2">
                      <Label htmlFor="password">
                        {t("registerPage.password_label")}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder={t("registerPage.password_placeholder")}
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
                      disabled={registerMut.isPending || loginMut.isPending}
                      className="h-11 w-full text-base shadow-md"
                    >
                      {registerMut.isPending || loginMut.isPending
                        ? t("registerPage.loading")
                        : t("registerPage.button")}
                    </Button>

                    {(registerMut.isError || loginMut.isError) && (
                      <p className="text-sm text-red-600">
                        {(registerMut.error as Error)?.message ||
                          (loginMut.error as Error)?.message}
                      </p>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
