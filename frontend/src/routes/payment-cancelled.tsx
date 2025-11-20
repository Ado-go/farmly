import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/payment-cancelled")({
  component: PaymentCancelledPage,
});

function PaymentCancelledPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const orderId = (search as { orderId?: string }).orderId;

  const handleRetry = async () => {
    if (!orderId) return;

    try {
      const res = await apiFetch(`/checkout/payment-link/${orderId}`, {
        method: "POST",
      });

      window.location.href = res.url;
    } catch (err) {
      console.error(err);
      alert(t("payment.retryError"));
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardContent className="p-6 space-y-4 text-center">
          <h1 className="text-2xl font-bold text-red-600">
            {t("payment.cancelledTitle")}
          </h1>

          <p className="text-gray-700">{t("payment.cancelledDescription")}</p>

          <Button className="mt-4" onClick={handleRetry}>
            {t("payment.retry")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
