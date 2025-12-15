import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Clock3 } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { formatDateRange } from "@/lib/formatDateRange";
import type { Event } from "@/types/events";

type OngoingCarouselProps = {
  events: Event[];
};

export function OngoingCarousel({ events }: OngoingCarouselProps) {
  const { t } = useTranslation();

  const renderCard = (event: Event) => {
    const cover = event.images?.[0]?.optimizedUrl || event.images?.[0]?.url;

    return (
      <CarouselItem
        key={event.id}
        className="md:basis-1/2 lg:basis-1/3 xl:basis-1/3"
      >
        <Link to="/events/$id" params={{ id: String(event.id) }}>
          <Card className="h-full overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-white to-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-primary/35 dark:from-primary/18 dark:via-emerald-900/40 dark:to-background">
            <div className="relative h-44 w-full overflow-hidden">
              {cover ? (
                <img
                  src={cover}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
                  {t("eventsDetail.noImage")}
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-600 shadow-sm backdrop-blur dark:bg-rose-900/70 dark:text-rose-50">
                <span className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_0_6px_rgba(248,113,113,0.35)]" />
                {t("eventsPage.liveNow")}
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-sm text-white">
                <span className="font-medium">{event.city}</span>
                <span className="flex items-center gap-1 text-white/80">
                  <Clock3 className="h-4 w-4" />
                  {formatDateRange(event.startDate, event.endDate)}
                </span>
              </div>
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2 min-w-0">
                <h3 className="text-lg font-semibold leading-snug">
                  {event.title}
                </h3>
                <span
                  className="max-w-[140px] rounded-full bg-white px-2 py-0.5 text-[11px] leading-tight font-semibold text-primary shadow-sm truncate dark:bg-emerald-900/60 dark:text-emerald-50"
                  title={event.region || t("eventsPage.regionLabel")}
                >
                  {event.region || t("eventsPage.regionLabel")}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-gray-600">
                {event.description || t("eventsPage.noDescription")}
              </p>
              {event.eventProducts?.length ? (
                <div className="flex flex-wrap gap-2">
                  {event.eventProducts.slice(0, 3).map((p) => (
                    <span
                      key={p.id}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {p.product.name} • €
                      {(p.price ?? p.product.basePrice ?? 0).toFixed(2)}
                      {typeof p.stock === "number"
                        ? ` • ${t("productCard.stock")}: ${p.stock}`
                        : ""}
                    </span>
                  ))}
                  {event.eventProducts.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{event.eventProducts.length - 3}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          </Card>
        </Link>
      </CarouselItem>
    );
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t("eventsPage.ongoing")}
          </p>
          <p className="text-sm text-gray-600">
            {t("eventsPage.ongoingDescription")}
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed text-gray-500">
          <div className="flex items-center justify-between gap-3 p-6">
            <div className="space-y-1">
              <p className="font-semibold">{t("eventsPage.noOngoing")}</p>
              <p className="text-sm text-gray-500">
                {t("eventsPage.upcomingDescription")}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="relative">
          <Carousel
            opts={{ align: "start", loop: events.length > 2 }}
            className="w-full"
          >
            <CarouselContent className="pb-4">
              {events.map((event) => renderCard(event))}
            </CarouselContent>
            <CarouselPrevious className="-left-6 hidden md:flex" />
            <CarouselNext className="-right-6 hidden md:flex" />
          </Carousel>
        </div>
      )}
    </section>
  );
}
