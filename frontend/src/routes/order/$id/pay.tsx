import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Loader2, XCircle } from "lucide-react";

export const Route = createFileRoute("/order/$id/pay")({
  component: PayOrderPage,
});

function PayOrderPage() {
  const { id } = Route.useParams();
  const search = Route.useSearch();
  const orderNumber = (search as { orderNumber?: string }).orderNumber;
  const { t } = useTranslation();
  const [status, setStatus] = useState<
    "redirecting" | "alreadyPaid" | "notFound" | "error"
  >("redirecting");

  const statusContent = {
    redirecting: {
      title: t("payment.redirecting"),
      description: t("payment.redirecting"),
      icon: Loader2,
      iconClass: "text-blue-700",
      cardBorder: "border-blue-100",
      ring: "ring-blue-100",
      headerBg: "from-blue-50 via-white to-white",
    },
    alreadyPaid: {
      title: t("payment.alreadyPaid"),
      description: t("payment.successDescription"),
      icon: CheckCircle2,
      iconClass: "text-emerald-700",
      cardBorder: "border-emerald-100",
      ring: "ring-emerald-100",
      headerBg: "from-emerald-50 via-white to-white",
    },
    notFound: {
      title: t("payment.notFound"),
      description: t("payment.notFound"),
      icon: AlertTriangle,
      iconClass: "text-amber-700",
      cardBorder: "border-amber-100",
      ring: "ring-amber-100",
      headerBg: "from-amber-50 via-white to-white",
    },
    error: {
      title: t("payment.cannotLoad"),
      description: t("payment.cannotLoad"),
      icon: XCircle,
      iconClass: "text-rose-700",
      cardBorder: "border-rose-100",
      ring: "ring-rose-100",
      headerBg: "from-rose-50 via-white to-white",
    },
  } as const;

  const currentStatus = statusContent[status];
  const Icon = currentStatus.icon;

  useEffect(() => {
    let isMounted = true;
    setStatus("redirecting");

    apiFetch(`/checkout/payment-link/${id}`, {
      method: "POST",
    })
      .then((res) => {
        if (!isMounted) return;
        window.location.href = res.url;
      })
      .catch((err) => {
        if (!isMounted) return;

        let toastMessage = t("payment.cannotLoad");
        const message = (
          err instanceof Error ? err.message : String(err || "")
        ).toLowerCase();

        if (message.includes("not found")) {
          setStatus("notFound");
          toastMessage = t("payment.notFound");
        } else if (
          message.includes("already closed") ||
          message.includes("400")
        ) {
          setStatus("alreadyPaid");
          toastMessage = t("payment.alreadyPaid");
        } else {
          setStatus("error");
        }

        toast.error(toastMessage);
      });

    return () => {
      isMounted = false;
    };
  }, [id, t]);

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <Card
          className={`overflow-hidden border shadow-sm ${currentStatus.cardBorder}`}
        >
          <div
            className={`bg-gradient-to-r px-8 py-6 ${currentStatus.headerBg}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm ring-1 ${currentStatus.ring}`}
                >
                  <Icon
                    className={`h-7 w-7 ${currentStatus.iconClass} ${
                      status === "redirecting" ? "animate-spin" : ""
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide ${currentStatus.iconClass}`}
                  >
                    {t("ordersPage.status")}
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {currentStatus.title}
                  </p>
                </div>
              </div>

              {orderNumber ? (
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-4 py-2 text-xs font-medium text-gray-700 shadow-inner">
                  <span className="text-gray-500">{t("ordersPage.order")}</span>
                  <span className="rounded bg-gray-100 px-2 py-1 text-[0.8rem] font-semibold text-gray-900">
                    #{orderNumber}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <CardContent className="p-8">
            <div className="space-y-6 text-center">
              <p className="text-lg text-muted-foreground">
                {currentStatus.description}
              </p>

              {status === "redirecting" ? (
                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>{t("payment.redirecting")}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Button asChild className="min-w-[180px]">
                    <Link to="/">{t("goHome")}</Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
