import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "../lib/api";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "forgotPasswordPage.errors.requiredEmail")
    .regex(
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      "forgotPasswordPage.errors.invalidEmail"
    ),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordPage() {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordForm) => {
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success(t("forgotPasswordPage.success"), {
        className: "bg-card text-card-foreground border-border",
      });
      reset();
    } catch {
      toast.error(t("forgotPasswordPage.error"), {
        className: "bg-card text-card-foreground border-border",
      });
    }
  };

  return (
    <div className="flex flex-col items-center  min-h-[80vh] px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          {t("forgotPasswordPage.title")}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t("forgotPasswordPage.subtitle")}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Field>
            <Label>{t("forgotPasswordPage.emailLabel")}</Label>
            <Input
              className="bg-white"
              type="email"
              placeholder={t("forgotPasswordPage.emailPlaceholder")}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {t(errors.email.message!)}
              </p>
            )}
          </Field>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? t("forgotPasswordPage.sending")
              : t("forgotPasswordPage.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
