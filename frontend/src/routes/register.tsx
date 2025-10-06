import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "FARMER">("CUSTOMER");

  const registerMut = useMutation({
    mutationFn: async () =>
      apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, role }),
      }),
  });

  const loginMut = useMutation({
    mutationFn: async () =>
      apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    onSuccess: (data: any) => {
      setUser(data.user);
      qc.invalidateQueries(["profile"]);
      navigate({ to: "/" });
    },
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await registerMut.mutateAsync();
    await loginMut.mutateAsync();
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br />
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <label>
          <input
            type="radio"
            checked={role === "CUSTOMER"}
            onChange={() => setRole("CUSTOMER")}
          />{" "}
          Customer
        </label>
        <label style={{ marginLeft: 8 }}>
          <input
            type="radio"
            checked={role === "FARMER"}
            onChange={() => setRole("FARMER")}
          />{" "}
          Farmer
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
