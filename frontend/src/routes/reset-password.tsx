import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "../lib/api";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  resetPasswordSchema,
  type ResetPasswordForm,
} from "@/schemas/authSchema";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  if (!token) {
    return (
      <p className="text-red-500 text-center mt-10">
        {t("resetPasswordPage.errors.missingToken")}
      </p>
    );
  }

  const onSubmit = async (values: ResetPasswordForm) => {
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, ...values }),
      });

      toast.success(t("resetPasswordPage.successTitle"), {
        description: t("resetPasswordPage.success"),
      });

      setTimeout(() => navigate({ to: "/login" }), 2000);
    } catch {
      toast.error(t("resetPasswordPage.errorTitle"), {
        description: t("resetPasswordPage.error"),
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          {t("resetPasswordPage.title")}
        </h1>
        <p className="text-center text-sm text-muted-foreground">
          {t("resetPasswordPage.subtitle")}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Field>
            <Label>{t("resetPasswordPage.passwordLabel")}</Label>
            <Input
              className="bg-white"
              type="password"
              placeholder={t("resetPasswordPage.passwordPlaceholder")}
              {...register("newPassword")}
            />
            {errors.newPassword && (
              <p className="text-red-500 text-sm">
                {t(errors.newPassword.message!)}
              </p>
            )}
          </Field>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? t("resetPasswordPage.sending")
              : t("resetPasswordPage.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
