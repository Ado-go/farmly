import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { setUser } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: async () =>
      apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    onSuccess: (data: any) => {
      // Backend returns user and sets cookies (access/refresh)
      setUser(data.user);
      qc.invalidateQueries(["profile"]);
      navigate({ to: "/" });
    },
  });

  return (
    <div>
      <h2>Login</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
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
