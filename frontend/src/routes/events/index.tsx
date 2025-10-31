import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/events/")({
  component: EventsPage,
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
};

function EventsPage() {
  const { t } = useTranslation();

  const {
    data: events = [],
    isLoading,
    isError,
  } = useQuery<Event[]>({
    queryKey: ["public-events"],
    queryFn: async () => apiFetch("/public-events"),
  });

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
    (e) => new Date(e.startDate) <= now && new Date(e.endDate) >= now
  );
  const upcoming = events.filter((e) => new Date(e.startDate) > now);

  const renderEventCard = (event: Event) => (
    <Link key={event.id} to={`/events/${event.id}`}>
      <Card className="p-4 hover:shadow-lg transition">
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
    </div>
  );
}
