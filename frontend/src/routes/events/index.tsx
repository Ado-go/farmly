import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/PaginationControls";
import { apiFetch } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginatedResponse } from "@/types/pagination";

export const Route = createFileRoute("/events/")({
  component: EventsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Math.max(1, Number(search.page) || 1),
  }),
});

type EventProduct = {
  id: number;
  product: {
    id: number;
    name: string;
    category: string;
    description: string;
    basePrice: number;
    images: { url: string }[];
  };
  user: { id: number; name: string };
};

type Event = {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  city: string;
  region: string;
  organizer: { id: number; name: string };
  eventProducts: EventProduct[];
  images?: { url: string; optimizedUrl?: string }[];
};

function EventsPage() {
  const { t } = useTranslation();
  useEffect(() => {
    document.title = `${t("events")} | ${t("farmly")}`;
  }, [t]);

  const { page } = Route.useSearch();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const {
    data,
    isLoading,
    isError,
  } = useQuery<PaginatedResponse<Event>>({
    queryKey: ["public-events", page],
    queryFn: async () =>
      apiFetch(`/public-events?page=${page}&limit=${DEFAULT_PAGE_SIZE}`),
    placeholderData: keepPreviousData,
  });

  const events = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(nextPage, totalPages || nextPage));
    navigate({ to: "/events", search: { page: safePage } });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse h-40" />
        ))}
        <p className="col-span-full text-center text-gray-500 mt-4">
          {t("eventsPage.loading")}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-red-500 p-6">
        {t("eventsPage.errorLoading")}
      </p>
    );
  }

  const now = new Date();
  const ongoing = events.filter(
    (event: Event) =>
      new Date(event.startDate) <= now && new Date(event.endDate) >= now
  );
  const upcoming = events.filter((event: Event) => new Date(event.startDate) > now);

  const renderEventCard = (event: Event) => (
    <Link key={event.id} to="/events/$id" params={{ id: String(event.id) }}>
      <Card className="p-0 hover:shadow-lg transition overflow-hidden">
        {(() => {
          const cover =
            event.images?.[0]?.optimizedUrl || event.images?.[0]?.url;
          return cover ? (
            <img
              src={cover}
              alt={event.title}
              className="h-36 w-full object-cover"
            />
          ) : (
            <div className="h-36 w-full bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
              {t("eventsDetail.noImage")}
            </div>
          );
        })()}

        <div className="p-4">
          <h3 className="font-bold">{event.title}</h3>
          <p className="text-sm text-gray-600">{event.city}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(event.startDate).toLocaleDateString()} -{" "}
            {new Date(event.endDate).toLocaleDateString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {t("eventsPage.organizedBy")} {event.organizer.name}
          </p>

          {event.eventProducts?.length > 0 && (
            <ul className="text-xs text-gray-600 mt-2">
              {event.eventProducts.slice(0, 2).map((p) => (
                <li key={p.id}>• {p.product.name}</li>
              ))}
              {event.eventProducts.length > 2 && <li>…</li>}
            </ul>
          )}
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-2xl font-bold mb-6">{t("eventsPage.title")}</h2>

      <section>
        <h3 className="text-xl font-semibold mb-4">
          {t("eventsPage.ongoing")}
        </h3>
        {ongoing.length === 0 ? (
          <p className="text-gray-500">{t("eventsPage.noOngoing")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {ongoing.map(renderEventCard)}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-4">
          {t("eventsPage.upcoming")}
        </h3>
        {upcoming.length === 0 ? (
          <p className="text-gray-500">{t("eventsPage.noUpcoming")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {upcoming.map(renderEventCard)}
          </div>
        )}
      </section>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        prevLabel={t("pagination.previous")}
        nextLabel={t("pagination.next")}
        className="pt-2"
      />
    </div>
  );
}
