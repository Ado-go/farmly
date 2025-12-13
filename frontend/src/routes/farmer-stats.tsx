import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  ShoppingBag,
  ShoppingBasket,
  Star,
  TrendingUp,
  Wallet,
} from "lucide-react";

type FarmerStats = {
  totals: {
    orders: number;
    preorders: number;
    totalRevenue: number;
    standardRevenue: number;
    preorderRevenue: number;
    itemsSold: number;
    avgTicket: number;
  };
  bestSellers: {
    productId: number;
    name: string;
    quantity: number;
    revenue: number;
  }[];
  ratings: {
    average: number | null;
    totalReviews: number;
    topRated: {
      productId: number;
      name: string;
      averageRating: number | null;
      reviewCount: number;
    }[];
  };
};

export const Route = createFileRoute("/farmer-stats")({
  component: FarmerStatsPage,
});

function FarmerStatsPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const locale = i18n.language === "sk" ? "sk-SK" : "en-US";

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale),
    [locale]
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery<FarmerStats>({
    queryKey: ["farmer-stats"],
    queryFn: () => apiFetch("/farmer-stats"),
    retry: false,
  });

  if (user && user.role !== "FARMER") {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-10 text-center">
        <Card className="border-red-100 bg-red-50/70">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-red-800">
              {t("farmerStatsPage.unauthorized")}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">{t("go_home")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10">
        <div className="h-10 w-48 animate-pulse rounded-full bg-emerald-100" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className="h-32 animate-pulse rounded-2xl border border-emerald-50 bg-white/70 shadow-sm"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-red-600">
        {t("farmPage.errorLoading")}
      </div>
    );
  }

  const metrics = [
    {
      label: t("farmerStatsPage.orders"),
      value: numberFormatter.format(stats.totals.orders ?? 0),
      icon: ShoppingBag,
      tone: "from-emerald-50 to-emerald-100",
    },
    {
      label: t("farmerStatsPage.preorders"),
      value: numberFormatter.format(stats.totals.preorders ?? 0),
      icon: ShoppingBasket,
      tone: "from-amber-50 to-orange-100",
    },
    {
      label: t("farmerStatsPage.itemsSold"),
      value: numberFormatter.format(stats.totals.itemsSold ?? 0),
      icon: TrendingUp,
      tone: "from-sky-50 to-blue-100",
    },
    {
      label: t("farmerStatsPage.revenue"),
      value: currencyFormatter.format(stats.totals.totalRevenue ?? 0),
      icon: Wallet,
      tone: "from-emerald-100 to-green-200",
    },
    {
      label: t("farmerStatsPage.standardRevenue"),
      value: currencyFormatter.format(stats.totals.standardRevenue ?? 0),
      icon: LineChart,
      tone: "from-blue-50 to-indigo-100",
    },
    {
      label: t("farmerStatsPage.preorderRevenue"),
      value: currencyFormatter.format(stats.totals.preorderRevenue ?? 0),
      icon: LineChart,
      tone: "from-purple-50 to-pink-100",
    },
  ];

  const bestSellers = stats.bestSellers ?? [];
  const topRated = stats.ratings.topRated ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-6 shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.08),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(251,191,36,0.1),transparent_32%)]" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                {t("farmerStatsPage.lastUpdated")}
              </p>
              <h1 className="text-3xl font-semibold">
                {t("farmerStatsPage.title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t("farmerStatsPage.subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-2 text-xs font-medium text-emerald-800 shadow-sm">
              <Star className="h-4 w-4 fill-emerald-500 text-emerald-600" />
              <span>
                {t("farmerStatsPage.averageRating")}{" "}
                {stats.ratings.average
                  ? stats.ratings.average.toFixed(2)
                  : "–"}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <Card
                key={metric.label}
                className="overflow-hidden border-emerald-50 bg-white/85 shadow-sm"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className={`rounded-xl bg-gradient-to-br ${metric.tone} p-3 shadow-inner`}
                  >
                    <metric.icon className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      {metric.label}
                    </p>
                    <p className="text-xl font-semibold">{metric.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {stats.totals.orders === 0 &&
        stats.totals.preorders === 0 &&
        bestSellers.length === 0 ? (
          <Card className="border-dashed border-emerald-200 bg-emerald-50/50">
            <CardContent className="space-y-3 p-6 text-center">
              <p className="text-lg font-semibold text-emerald-900">
                {t("farmerStatsPage.empty")}
              </p>
              <Button asChild>
                <Link to="/farm">{t("my_farms")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr,0.9fr]">
            <Card className="border-emerald-100 bg-white/80 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {t("farmerStatsPage.bestSellers")}
                  </CardTitle>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                    {t("farmerStatsPage.revenue")}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {bestSellers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("farmerStatsPage.emptyBestSellers")}
                  </p>
                ) : (
                  <div className="divide-y divide-emerald-50">
                    {bestSellers.map((item) => (
                      <div
                        key={item.productId}
                        className="grid grid-cols-[1fr,auto,auto] items-center gap-3 py-3 md:grid-cols-[1.2fr,auto,auto]"
                      >
                        <div className="space-y-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            #{item.productId}
                          </p>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {t("farmerStatsPage.quantity")}:{" "}
                          <span className="font-semibold text-foreground">
                            {numberFormatter.format(item.quantity)}
                          </span>
                        </div>
                        <div className="text-right text-sm font-semibold text-emerald-700">
                          {currencyFormatter.format(item.revenue)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-white/80 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {t("farmerStatsPage.ratings")}
                  </CardTitle>
                  <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                    <span>
                      {stats.ratings.average
                        ? stats.ratings.average.toFixed(2)
                        : "–"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-3">
                  <p className="text-4xl font-semibold text-amber-600">
                    {stats.ratings.average
                      ? stats.ratings.average.toFixed(2)
                      : "–"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {numberFormatter.format(stats.ratings.totalReviews)}{" "}
                    {t("farmerStatsPage.reviews")}
                  </p>
                </div>
                <div className="space-y-3">
                  {topRated.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t("farmerStatsPage.emptyBestSellers")}
                    </p>
                  ) : (
                    topRated.map((product) => (
                      <div
                        key={product.productId}
                        className="flex items-center justify-between rounded-xl border border-amber-50 bg-amber-50/60 px-3 py-2"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {numberFormatter.format(product.reviewCount)}{" "}
                            {t("farmerStatsPage.reviews")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-amber-600">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                          <span className="text-sm font-semibold">
                            {product.averageRating
                              ? product.averageRating.toFixed(2)
                              : "–"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
