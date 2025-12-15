import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/PaginationControls";
import { formatDateRange } from "@/lib/formatDateRange";
import type { Event } from "@/types/events";

type UpcomingGridProps = {
  events: Event[];
  hasNoMatches: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function UpcomingGrid({
  events,
  hasNoMatches,
  page,
  totalPages,
  onPageChange,
}: UpcomingGridProps) {
  const { t } = useTranslation();

  const renderCard = (event: Event) => {
    const cover = event.images?.[0]?.optimizedUrl || event.images?.[0]?.url;

    return (
      <Link key={event.id} to="/events/$id" params={{ id: String(event.id) }}>
        <Card className="group h-full overflow-hidden border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-white transition hover:-translate-y-1 hover:shadow-lg dark:border-primary/30 dark:from-primary/18 dark:via-emerald-900/40 dark:to-background">
          <div className="relative h-40 w-full overflow-hidden">
            {cover ? (
              <img
                src={cover}
                alt={event.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
                {t("eventsDetail.noImage")}
              </div>
            )}
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur dark:bg-emerald-900/70 dark:text-emerald-50">
              {formatDateRange(event.startDate, event.endDate)}
            </span>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-2 min-w-0">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-primary">
                  {t("eventsPage.upcoming")}
                </p>
                <h3 className="text-lg font-semibold leading-tight">
                  {event.title}
                </h3>
              </div>
              <span
                className="max-w-[140px] rounded-full bg-primary/10 px-2 py-0.5 text-[11px] leading-tight font-semibold text-primary truncate dark:bg-emerald-900/60 dark:text-emerald-50"
                title={event.region || t("eventsPage.regionLabel")}
              >
                {event.region || t("eventsPage.regionLabel")}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-primary" />
              <span>
                {event.city}
                {event.region ? ` • ${event.region}` : ""}
              </span>
            </div>
            <p className="line-clamp-2 text-sm text-gray-600">
              {event.description || t("eventsPage.noDescription")}
            </p>
            {event.eventProducts?.length ? (
              <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                {event.eventProducts.slice(0, 2).map((p) => (
                  <span
                    key={p.id}
                    className="rounded-full bg-gray-100 px-2 py-1 dark:bg-emerald-900/50 dark:text-emerald-50"
                  >
                    {p.product.name} • €
                    {(p.price ?? p.product.basePrice ?? 0).toFixed(2)} •{" "}
                    {t("productCard.stock")}: {p.stock ?? 0}
                  </span>
                ))}
                {event.eventProducts.length > 2 && (
                  <span className="text-xs text-gray-500">
                    +{event.eventProducts.length - 2}
                  </span>
                )}
              </div>
            ) : null}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {t("eventsPage.organizedBy")} {event.organizer.name}
              </span>
              {event.eventProducts?.length ? (
                <span className="rounded-full bg-gray-100 px-3 py-1 dark:bg-emerald-900/50 dark:text-emerald-50">
                  {t("eventsPage.productsCount", {
                    count: event.eventProducts.length,
                  })}
                </span>
              ) : null}
            </div>
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t("eventsPage.upcoming")}
          </p>
          <p className="text-sm text-gray-600">
            {t("eventsPage.upcomingDescription")}
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed bg-white/70 p-6 text-gray-500">
          {hasNoMatches
            ? t("eventsPage.noResults")
            : t("eventsPage.noUpcoming")}
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => renderCard(event))}
          </div>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            prevLabel={t("pagination.previous")}
            nextLabel={t("pagination.next")}
            className="pt-2"
          />
        </>
      )}
    </section>
  );
}
