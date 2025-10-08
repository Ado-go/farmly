import { useState, FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { apiFetch } from "../lib/api";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token");

  if (!token) {
    return <p style={{ color: "red" }}>Token v URL chýba alebo je neplatný.</p>;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: password }),
      });

      setMessage("Heslo bolo úspešne zmenené. Presmerovávam na login...");
      setTimeout(() => navigate({ to: "/login" }), 3000);
    } catch {
      setError(
        "Nepodarilo sa zmeniť heslo. Token môže byť neplatný alebo expirovaný."
      );
    }
  };

  return (
    <div>
      <h1>Obnov heslo</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Nové heslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Zmeniť heslo</button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
