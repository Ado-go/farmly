import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  CalendarDays,
  Leaf,
  MapPin,
  Package,
  Sparkles,
  Sprout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/ProductCard";
import { apiFetch } from "@/lib/api";
import type { PaginatedResponse } from "@/types/pagination";
import type { FarmProduct } from "@/types/farm";
import type { Event } from "@/types/events";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type HomeStats = {
  farmers: number;
  orders: number;
  preorders: number;
};

function HomePage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "sk" ? "sk-SK" : "en-US";

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale),
    [locale]
  );

  const { data: stats } = useQuery<HomeStats>({
    queryKey: ["public-stats"],
    queryFn: () => apiFetch("/public-stats"),
  });

  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsError,
  } = useQuery<PaginatedResponse<Event>>({
    queryKey: ["home-events"],
    queryFn: () => apiFetch("/public-events?page=1&limit=3"),
  });

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery<PaginatedResponse<FarmProduct>>({
    queryKey: ["home-products"],
    queryFn: () =>
      apiFetch(
        "/public-farm-products?page=1&limit=3&sort=newest&order=desc"
      ),
  });

  const events = eventsData?.items ?? [];
  const products = productsData?.items ?? [];

  const statsItems = [
    { icon: Sprout, label: t("homePage.metricsFarmers"), value: stats?.farmers },
    { icon: Package, label: t("homePage.metricsPreorders"), value: stats?.preorders },
    { icon: Leaf, label: t("homePage.metricsOrders"), value: stats?.orders },
  ];

  const formatStat = (value?: number) =>
    typeof value === "number" ? numberFormatter.format(value) : "–";

  const formatDateRange = (startDate: string, endDate: string) => {
    const fmt = new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" });
    const start = fmt.format(new Date(startDate));
    const end = fmt.format(new Date(endDate));
    return start === end ? start : `${start} – ${end}`;
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    if (start <= now && end >= now) return t("homePage.eventsStatusOngoing");
    return t("homePage.eventsStatusUpcoming");
  };

  const tipTexts = [
    t("homePage.sideTip1"),
    t("homePage.sideTip2"),
    t("homePage.sideTip3"),
  ];

  return (
    <main className="bg-gradient-to-b from-muted/40 via-background to-background">
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        <section
          className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive-foreground shadow-sm"
          role="alert"
        >
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-semibold">{t("homePage.alertTitle")}</p>
            <p className="text-sm leading-relaxed">
              {t("homePage.alertMessage")}
            </p>
          </div>
        </section>

        <section className="grid items-stretch gap-6 lg:grid-cols-[1.35fr,1fr]">
          <div className="relative overflow-hidden rounded-3xl border bg-card/80 p-8 shadow-sm">
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-transparent to-secondary/20" />
            <div className="space-y-5">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                {t("homePage.heroTitle")}
              </h1>
              <p className="max-w-3xl text-lg text-muted-foreground">
                {t("homePage.heroDescription")}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link
                    to="/products"
                    search={{
                      page: 1,
                      sort: "newest",
                      category: undefined,
                      order: "desc",
                      search: undefined,
                    }}
                  >
                    {t("homePage.ctaProducts")}
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10"
                >
                  <Link
                    to="/events"
                    search={{ page: 1, search: undefined, region: undefined }}
                  >
                    {t("homePage.ctaEvents")}
                  </Link>
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {statsItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-white/70 p-4 shadow-sm"
                  >
                    <item.icon className="h-10 w-10 rounded-xl bg-primary/15 p-2 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="text-lg font-semibold text-foreground">
                        {formatStat(item.value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-3xl border bg-primary/5 p-6 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="h-4 w-4" />
                {t("homePage.sideLabel")}
              </div>
              <h2 className="text-2xl font-semibold text-foreground">
                {t("homePage.sideTitle")}
              </h2>
              <p className="text-muted-foreground">
                {t("homePage.sideDescription")}
              </p>
            </div>
            <div className="space-y-3">
              {tipTexts.map((tip) => (
                <div
                  key={tip}
                  className="flex items-start gap-3 rounded-2xl border border-primary/10 bg-white/80 p-3"
                >
                  <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <p className="text-sm leading-relaxed text-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                {t("homePage.eventsLabel")}
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                {t("homePage.eventsTitle")}
              </h2>
              <p className="text-muted-foreground">
                {t("homePage.eventsDescription")}
              </p>
            </div>
            <Button asChild variant="ghost" className="text-primary">
              <Link
                to="/events"
                search={{ page: 1, search: undefined, region: undefined }}
              >
                {t("homePage.eventsCta")}
              </Link>
            </Button>
          </div>

          {eventsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card
                  key={idx}
                  className="h-40 animate-pulse border border-primary/10 bg-white/70"
                />
              ))}
            </div>
          ) : eventsError || events.length === 0 ? (
            <p className="rounded-2xl border bg-card/60 p-4 text-sm text-muted-foreground">
              {t("homePage.eventsEmpty")}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const status = getEventStatus(event);
                const statusClass =
                  status === t("homePage.eventsStatusOngoing")
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700";

                return (
                  <Card
                    key={event.id}
                    className="group h-full border border-primary/10 bg-white/75 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <CalendarDays className="h-4 w-4" />
                        <span>
                          {formatDateRange(event.startDate, event.endDate)}
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass}`}
                      >
                        {status}
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold text-foreground">
                      {event.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {event.description || t("homePage.eventsNoDescription")}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 text-secondary" />
                      <span>
                        {[event.city, event.region].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-3xl border bg-card/80 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                {t("homePage.productsLabel")}
              </p>
              <h2 className="text-2xl font-semibold text-foreground">
                {t("homePage.productsTitle")}
              </h2>
              <p className="text-muted-foreground">
                {t("homePage.productsDescription")}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link
                to="/products"
                search={{
                  page: 1,
                  sort: "newest",
                  category: undefined,
                  order: "desc",
                  search: undefined,
                }}
              >
                {t("homePage.productsCta")}
              </Link>
            </Button>
          </div>

          {productsLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card
                  key={idx}
                  className="h-64 animate-pulse border border-primary/10 bg-white/70"
                />
              ))}
            </div>
          ) : productsError || products.length === 0 ? (
            <p className="rounded-2xl border bg-card/60 p-4 text-sm text-muted-foreground">
              {t("homePage.productsEmpty")}
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  sellerNameOverride={product.farm?.name}
                />
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 rounded-3xl border bg-white/80 p-6 shadow-sm md:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              {t("homePage.aboutLabel")}
            </p>
            <h2 className="text-2xl font-semibold text-foreground">
              {t("homePage.aboutTitle")}
            </h2>
            <p className="text-muted-foreground">
              {t("homePage.aboutDescription")}
            </p>
            <ul className="space-y-2 text-sm text-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                {t("homePage.aboutPoint1")}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-secondary" />
                {t("homePage.aboutPoint2")}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                {t("homePage.aboutPoint3")}
              </li>
            </ul>
          </div>
          <div className="flex flex-col justify-center gap-4 rounded-2xl bg-gradient-to-br from-primary/15 via-white to-secondary/15 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Sprout className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("homePage.aboutHelper")}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {t("homePage.aboutHelperHeadline")}
                </p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("homePage.aboutHelperBody")}
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-primary">
              <span className="rounded-full bg-primary/10 px-3 py-1">
                {t("homePage.aboutBadgeFair")}
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1">
                {t("homePage.aboutBadgeCommunity")}
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1">
                {t("homePage.aboutBadgeLessWaste")}
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
