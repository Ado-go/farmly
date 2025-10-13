import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function LogoutButton() {
  const qc = useQueryClient();
  const { logoutLocal } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const mut = useMutation({
    mutationFn: () => apiFetch("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      logoutLocal();
      qc.clear();
      navigate({ to: "/" });
    },
  });

  return (
    <button onClick={() => mut.mutate()} disabled={mut.isPending}>
      {t("logout")}
    </button>
  );
}
