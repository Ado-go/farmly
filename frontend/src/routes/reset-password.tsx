import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "../lib/api";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

const resetSchema = z.object({
  newPassword: z.string().min(6, "Heslo musí mať aspoň 6 znakov"),
});

type ResetForm = z.infer<typeof resetSchema>;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  if (!token) {
    return <p style={{ color: "red" }}>Token v URL chýba alebo je neplatný.</p>;
  }

  const onSubmit = async (values: ResetForm) => {
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, ...values }),
      });
      alert("Heslo bolo zmenené. Presmerovávam na login...");
      setTimeout(() => navigate({ to: "/login" }), 3000);
    } catch {
      alert("Chyba pri zmene hesla. Token je neplatný alebo expirovaný.");
    }
  };

  return (
    <div>
      <h1>Obnov heslo</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          type="password"
          placeholder="Nové heslo"
          {...register("newPassword")}
        />
        {errors.newPassword && (
          <p style={{ color: "red" }}>{errors.newPassword.message}</p>
        )}
        <button type="submit">Zmeniť heslo</button>
      </form>
    </div>
  );
}
