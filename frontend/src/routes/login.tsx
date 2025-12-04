import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@/types/user";
import { useTranslation } from "react-i18next";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";
import { AlertCircle, Leaf, Lock, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "loginPage.required_email")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "loginPage.invalid_email"),
  password: z.string().min(1, "loginPage.required_password"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPage() {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: LoginForm) =>
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

  const onSubmit = (values: LoginForm) => mutation.mutate(values);

  const friendlyError = mutation.error
    ? (() => {
        const message = (mutation.error as Error).message || "";
        const normalized = message.toLowerCase();
        if (normalized.includes("invalid or revoked refresh token")) {
          return t("loginPage.invalid_credentials");
        }
        if (normalized.includes("unauthorized") || normalized.includes("401")) {
          return t("loginPage.invalid_credentials");
        }
        return message || t("loginPage.invalid_credentials");
      })()
    : null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary/10 via-white to-emerald-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(76,175,80,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(245,166,35,0.15),transparent_30%)]" />

      <div className="relative mx-auto max-w-5xl px-4 py-10">
        <Card className="w-full overflow-hidden border-primary/15 bg-white/95 shadow-2xl backdrop-blur">
          <div className="grid md:grid-cols-[1.05fr_0.95fr]">
            <div className="relative hidden md:flex flex-col gap-6 bg-gradient-to-br from-primary via-emerald-600 to-emerald-500 p-10 text-primary-foreground">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.12),transparent_32%)]" />

              <div className="relative flex items-center gap-3">
                <div className="rounded-full bg-white/15 p-3">
                  <Leaf className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/70">
                    Farmly
                  </p>
                  <p className="text-lg font-semibold">
                    {t("loginPage.welcome_back")}
                  </p>
                </div>
              </div>

              <p className="relative max-w-md text-sm text-primary-foreground/90">
                {t("footer.tagline")}
              </p>

              <div className="relative grid gap-4">
                {[
                  { icon: ShieldCheck, label: t("loginPage.benefit_fresh") },
                  { icon: Sparkles, label: t("loginPage.benefit_plan") },
                  { icon: Lock, label: t("loginPage.benefit_support") },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur"
                  >
                    <item.icon className="h-5 w-5 text-white" />
                    <p className="text-sm font-medium text-primary-foreground">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative p-6 sm:p-10">
              <div className="mb-6 rounded-2xl bg-gradient-to-r from-primary to-emerald-600 p-4 text-primary-foreground md:hidden">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-white/20 p-2">
                    <Leaf className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-white/80">
                      Farmly
                    </p>
                    <p className="text-base font-semibold">
                      {t("loginPage.welcome_back")}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-primary-foreground/85">
                  {t("footer.tagline")}
                </p>
              </div>

              <CardHeader className="space-y-3 p-0">
                <CardTitle className="flex items-center gap-2 text-3xl">
                  {t("loginPage.title")}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {t("loginPage.subtitle")}
                </CardDescription>
              </CardHeader>

              {mutation.isError && friendlyError && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4" />
                  <p>{friendlyError}</p>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 space-y-5"
              >
                <Field className="space-y-2">
                  <Label htmlFor="email">{t("loginPage.email_label")}</Label>
                  <Input
                    id="email"
                    type="email"
                    className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600">
                      {t(errors.email.message!)}
                    </p>
                  )}
                </Field>

                <Field className="space-y-2">
                  <Label htmlFor="password">
                    {t("loginPage.password_label")}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    className="h-11 border-primary/25 bg-white shadow-sm focus:border-primary/50 focus-visible:ring-primary"
                    {...register("password")}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-600">
                      {t(errors.password.message!)}
                    </p>
                  )}
                </Field>

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="h-11 w-full text-base shadow-md"
                  >
                    {mutation.isPending
                      ? t("loginPage.loading")
                      : t("loginPage.button")}
                  </Button>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <Link
                      to="/forgot-password"
                      className="text-primary hover:underline"
                    >
                      {t("loginPage.forgot")} {t("loginPage.reset")}
                    </Link>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">
                        {t("loginPage.cta_register_question")}
                      </span>
                      <Button
                        variant="secondary"
                        asChild
                        className="h-11 px-4 text-base shadow-md"
                      >
                        <Link to="/register">
                          {t("loginPage.cta_register_button")}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
