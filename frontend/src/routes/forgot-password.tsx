import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiFetch } from "../lib/api";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email je povinný")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Zadaj platný email"),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

function ForgotPasswordPage() {
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
      alert("Email s inštrukciami bol odoslaný.");
      reset();
    } catch {
      alert("Nepodarilo sa odoslať email. Skús to znova.");
    }
  };

  return (
    <div>
      <h1>Zabudnuté heslo</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="email"
          placeholder="Zadaj svoj email"
          {...register("email")}
        />
        {errors.email && <p style={{ color: "red" }}>{errors.email.message}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Odosielam..." : "Odoslať"}
        </button>
      </form>
    </div>
  );
}
