import { useState, type FormEvent } from "react";
import { apiFetch } from "../lib/api";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      setMessage("Email s inštrukciami bol odoslaný.");
    } catch {
      setError("Nepodarilo sa odoslať email. Skús to znova.");
    }
  };

  return (
    <div>
      <h1>Zabudnuté heslo</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Zadaj svoj email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Odoslať</button>
      </form>
      {message && <p style={{ color: "green" }}>{message}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
