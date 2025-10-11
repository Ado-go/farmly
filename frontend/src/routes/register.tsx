import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { User } from "../types/user";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email je povinný")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Zadaj platný email"),
  password: z.string().min(6, "Heslo musí mať aspoň 6 znakov"),
  role: z.enum(["CUSTOMER", "FARMER"]),
});

type RegisterForm = z.infer<typeof registerSchema>;

function RegisterPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
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
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input placeholder="Email" {...register("email")} />
        {errors.email && <p style={{ color: "red" }}>{errors.email.message}</p>}
        <br />

        <input
          type="password"
          placeholder="Password"
          {...register("password")}
        />
        {errors.password && (
          <p style={{ color: "red" }}>{errors.password.message}</p>
        )}
        <br />

        <label>
          <input type="radio" value="CUSTOMER" {...register("role")} /> Customer
        </label>
        <label style={{ marginLeft: 8 }}>
          <input type="radio" value="FARMER" {...register("role")} /> Farmer
        </label>
        <br />

        <button
          type="submit"
          disabled={registerMut.isPending || loginMut.isPending}
        >
          Register
        </button>
      </form>

      {registerMut.isError && (
        <p style={{ color: "red" }}>{(registerMut.error as Error).message}</p>
      )}
    </div>
  );
}
