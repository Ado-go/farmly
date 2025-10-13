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
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/ui/field";

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

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle>{t("loginPage.title")}</CardTitle>
          <CardDescription>{t("loginPage.subtitle")}</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <Field>
              <Label htmlFor="email">{t("loginPage.email_label")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("loginPage.email_placeholder")}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">
                  {t(errors.email.message!)}
                </p>
              )}
            </Field>

            <Field>
              <Label htmlFor="password">{t("loginPage.password_label")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("loginPage.password_placeholder")}
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {t(errors.password.message!)}
                </p>
              )}
            </Field>
          </CardContent>

          <CardFooter className="flex flex-col gap-2">
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full"
            >
              {mutation.isPending
                ? t("loginPage.loading")
                : t("loginPage.button")}
            </Button>

            <p className="text-sm text-muted-foreground">
              {t("loginPage.forgot")}{" "}
              <Link
                to="/forgot-password"
                className="text-primary hover:underline"
              >
                {t("loginPage.reset")}
              </Link>
            </p>

            {mutation.isError && (
              <p className="text-sm text-red-500 mt-2">
                {(mutation.error as Error).message}
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
