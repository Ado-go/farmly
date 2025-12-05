import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/payment-success")({
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const search = Route.useSearch();
  const orderNumber = (search as { orderNumber?: string }).orderNumber;
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Card className="overflow-hidden border-emerald-100 shadow-sm">
          <div className="bg-gradient-to-r from-emerald-50 via-white to-white px-8 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {t("ordersPage.status")}
                  </p>
                  <p className="text-lg font-semibold text-emerald-900">
                    {t("payment.successTitle")}
                  </p>
                </div>
              </div>

              {orderNumber ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-medium text-emerald-900 shadow-inner">
                  <span className="text-emerald-700">
                    {t("ordersPage.order")}
                  </span>
                  <span className="rounded bg-emerald-100 px-2 py-1 text-[0.8rem] font-semibold">
                    #{orderNumber}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <CardContent className="p-8">
            <div className="space-y-6 text-center">
              <p className="text-lg text-muted-foreground">
                {orderNumber ? (
                  <>
                    {t("payment.successDescription")}{" "}
                    <span className="font-semibold text-foreground">
                      #{orderNumber}
                    </span>
                  </>
                ) : (
                  t("payment.successDescription")
                )}
              </p>

              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild className="min-w-[180px]">
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
