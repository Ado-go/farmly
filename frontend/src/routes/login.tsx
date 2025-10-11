import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "../types/user";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email je povinný")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Zadaj platný email"),
  password: z.string(),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginPage() {
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
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="Email" {...register("email")} />
        {errors.email && <p style={{ color: "red" }}>{errors.email.message}</p>}
        <br />

        <input placeholder="Heslo" type="password" {...register("password")} />
        {errors.password && (
          <p style={{ color: "red" }}>{errors.password.message}</p>
        )}
        <br />

        <button type="submit" disabled={mutation.isPending}>
          Login
        </button>

        <p>
          Zabudol si heslo? <Link to="/forgot-password">Obnoviť</Link>
        </p>
      </form>

      {mutation.isError && (
        <p style={{ color: "red" }}>{(mutation.error as Error).message}</p>
      )}
    </div>
  );
}
