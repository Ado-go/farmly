import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/payment-cancelled")({
  component: PaymentCancelledPage,
});

function PaymentCancelledPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const orderId = (search as { orderId?: string; orderNumber?: string }).orderId;
  const orderNumber = (search as { orderId?: string; orderNumber?: string }).orderNumber;
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!orderId) return;

    try {
      setIsRetrying(true);
      const res = await apiFetch(`/checkout/payment-link/${orderId}`, {
        method: "POST",
      });

      window.location.href = res.url;
    } catch (err) {
      console.error(err);
      toast.error(t("payment.retryError"));
      setIsRetrying(false);
    }
  };

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="overflow-hidden border-rose-100 shadow-sm">
          <div className="bg-gradient-to-r from-rose-50 via-white to-white px-8 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-rose-700 shadow-sm ring-1 ring-rose-100">
                  <XCircle className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-700">
                    {t("ordersPage.status")}
                  </p>
                  <p className="text-lg font-semibold text-rose-900">
                    {t("payment.cancelledTitle")}
                  </p>
                </div>
              </div>

              {orderNumber ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-4 py-2 text-xs font-medium text-rose-900 shadow-inner">
                  <span className="text-rose-700">{t("ordersPage.order")}</span>
                  <span className="rounded bg-rose-100 px-2 py-1 text-[0.8rem] font-semibold">
                    #{orderNumber}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <CardContent className="p-8">
            <div className="space-y-6 text-center">
              <p className="text-lg text-muted-foreground">
                {t("payment.cancelledDescription")}
              </p>

              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  className="min-w-[180px]"
                  onClick={handleRetry}
                  disabled={!orderId || isRetrying}
                >
                  {isRetrying ? t("payment.redirecting") : t("payment.retry")}
                </Button>
                <Button asChild variant="outline" className="min-w-[180px]">
                  <Link to="/">{t("go_home")}</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
