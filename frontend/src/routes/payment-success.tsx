import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/payment-success")({
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const search = Route.useSearch();
  const orderNumber = search.orderNumber as string | undefined;
  const { t } = useTranslation();

  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardContent className="p-6 space-y-4 text-center">
          <h1 className="text-2xl font-bold text-green-600">
            {t("payment.successTitle")}
          </h1>

          <p className="text-gray-700">
            {orderNumber ? (
              <>
                {t("payment.successDescription")}{" "}
                <strong>#{orderNumber}</strong>
              </>
            ) : (
              t("payment.successDescription")
            )}
          </p>

          <Button asChild className="mt-4">
            <Link to="/profile/orders">{t("payment.goToOrders")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
