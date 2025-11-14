import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/order/$id/pay")({
  component: PayOrderPage,
});

function PayOrderPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  useEffect(() => {
    apiFetch(`/checkout/payment-link/${id}`, {
      method: "POST",
    })
      .then((res) => {
        window.location.href = res.url;
      })
      .catch(async (err) => {
        console.error(err);

        if (err?.message?.includes("400")) {
          window.location.href = `/payment-success?orderId=${id}`;
          return;
        }

        alert(t("payment.cannotLoad"));
      });
  }, [id]);

  return (
    <div className="p-6 text-center text-gray-700">
      {t("payment.redirecting")}
    </div>
  );
}
