import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Leaf, Package, Sprout } from "lucide-react";
import { AlertBanner } from "@/components/homePage/AlertBanner";
import {
  HeroSection,
  type NavLink,
  type StatItem,
} from "@/components/homePage/HeroSection";
import { TipsPanel } from "@/components/homePage/TipsPanel";
import { EventsSection } from "@/components/homePage/EventsSection";
import { ProductsSection } from "@/components/homePage/ProductsSection";
import { AboutSection } from "@/components/homePage/AboutSection";
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

  const statsItems: StatItem[] = [
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

  const productsLink: NavLink = {
    to: "/products",
    search: {
      page: 1,
      sort: "newest",
      category: undefined,
      order: "desc",
      search: undefined,
    },
  };

  const eventsLink: NavLink = {
    to: "/events",
    search: { page: 1, search: undefined, region: undefined },
  };

  return (
    <main className="bg-background">
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        <AlertBanner
          title={t("homePage.alertTitle")}
          message={t("homePage.alertMessage")}
        />

        <section className="grid items-stretch gap-6 lg:grid-cols-[1.35fr,1fr]">
          <HeroSection
            title={t("homePage.heroTitle")}
            description={t("homePage.heroDescription")}
            ctaProductsLabel={t("homePage.ctaProducts")}
            ctaEventsLabel={t("homePage.ctaEvents")}
            productsLink={productsLink}
            eventsLink={eventsLink}
            statsItems={statsItems}
            formatStat={formatStat}
          />

          <TipsPanel
            label={t("homePage.sideLabel")}
            title={t("homePage.sideTitle")}
            description={t("homePage.sideDescription")}
            tips={tipTexts}
          />
        </section>

        <EventsSection
          label={t("homePage.eventsLabel")}
          title={t("homePage.eventsTitle")}
          description={t("homePage.eventsDescription")}
          ctaLabel={t("homePage.eventsCta")}
          ctaLink={eventsLink}
          events={events}
          loading={eventsLoading}
          error={!!eventsError}
          emptyText={t("homePage.eventsEmpty")}
          noDescriptionText={t("homePage.eventsNoDescription")}
          ongoingLabel={t("homePage.eventsStatusOngoing")}
          getEventStatus={getEventStatus}
          formatDateRange={formatDateRange}
        />

        <ProductsSection
          label={t("homePage.productsLabel")}
          title={t("homePage.productsTitle")}
          description={t("homePage.productsDescription")}
          ctaLabel={t("homePage.productsCta")}
          ctaLink={productsLink}
          products={products}
          loading={productsLoading}
          error={!!productsError}
          emptyText={t("homePage.productsEmpty")}
        />

        <AboutSection
          label={t("homePage.aboutLabel")}
          title={t("homePage.aboutTitle")}
          description={t("homePage.aboutDescription")}
          point1={t("homePage.aboutPoint1")}
          point2={t("homePage.aboutPoint2")}
          point3={t("homePage.aboutPoint3")}
          helper={t("homePage.aboutHelper")}
          helperHeadline={t("homePage.aboutHelperHeadline")}
          helperBody={t("homePage.aboutHelperBody")}
          badgeFair={t("homePage.aboutBadgeFair")}
          badgeCommunity={t("homePage.aboutBadgeCommunity")}
          badgeLessWaste={t("homePage.aboutBadgeLessWaste")}
        />
      </div>
    </main>
  );
}
