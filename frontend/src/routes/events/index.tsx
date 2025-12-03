import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { EventsHeader } from "@/components/events/EventsHeader";
import { OngoingCarousel } from "@/components/events/OngoingCarousel";
import { UpcomingGrid } from "@/components/events/UpcomingGrid";
import { apiFetch } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginatedResponse } from "@/types/pagination";
import type { Event } from "@/types/events";

export const Route = createFileRoute("/events/")({
  component: EventsPage,
  validateSearch: (search: Record<string, unknown>) => {
    const parsedSearch =
      typeof search.search === "string" && search.search.trim()
        ? search.search.trim()
        : undefined;
    const parsedRegion =
      typeof search.region === "string" && search.region.trim()
        ? search.region.trim()
        : undefined;

    return {
      page: Math.max(1, Number(search.page) || 1),
      search: parsedSearch,
      region: parsedRegion,
    };
  },
});

const REGIONS = [
  { value: "all", label: "All regions" },
  { value: "bratislavsky", label: "Bratislavský kraj" },
  { value: "trnavsky", label: "Trnavský kraj" },
  { value: "trenciansky", label: "Trenčiansky kraj" },
  { value: "nitriansky", label: "Nitriansky kraj" },
  { value: "zilinsky", label: "Žilinský kraj" },
  { value: "banskobystricky", label: "Banskobystrický kraj" },
  { value: "presovsky", label: "Prešovský kraj" },
  { value: "kosicky", label: "Košický kraj" },
];

function EventsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page, search, region } = Route.useSearch();
  const [searchTerm, setSearchTerm] = useState(search ?? "");
  const [selectedRegion, setSelectedRegion] = useState(region ?? "all");

  useEffect(() => {
    document.title = `${t("events")} | ${t("farmly")}`;
  }, [t]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    setSearchTerm(search ?? "");
  }, [search]);

  useEffect(() => {
    setSelectedRegion(region ?? "all");
  }, [region]);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed === (search ?? "")) return;

    const timeout = setTimeout(() => {
      navigate({
        to: "/events",
        search: {
          page: 1,
          search: trimmed || undefined,
          region: selectedRegion === "all" ? undefined : selectedRegion,
        },
      });
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchTerm, search, navigate, selectedRegion]);

  const handleRegionChange = (value: string) => {
    const nextRegion = value === "all" ? undefined : value;
    setSelectedRegion(value);
    navigate({
      to: "/events",
      search: {
        page: 1,
        search: searchTerm.trim() || undefined,
        region: nextRegion,
      },
    });
  };

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Event>>({
    queryKey: ["public-events", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(DEFAULT_PAGE_SIZE),
      });

      if (search) params.append("search", search);

      return apiFetch(`/public-events?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const events = useMemo(() => data?.items ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(nextPage, totalPages || nextPage));
    navigate({
      to: "/events",
      search: {
        page: safePage,
        search: search ?? undefined,
        region: selectedRegion === "all" ? undefined : selectedRegion,
      },
    });
  };

  const filteredEvents = useMemo(() => {
    if (!search) return events;
    const term = search.toLowerCase();
    return events.filter((event: Event) =>
      [event.title, event.city, event.organizer?.name, event.region]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(term))
    );
  }, [events, search]);

  const now = new Date();
  const ongoing = filteredEvents.filter(
    (event: Event) =>
      new Date(event.startDate) <= now && new Date(event.endDate) >= now
  );
  const upcoming = filteredEvents.filter(
    (event: Event) => new Date(event.startDate) > now
  );

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <Card className="space-y-4 border-primary/20 bg-white/80 p-6">
            <div className="h-6 w-40 rounded bg-gray-200" />
            <div className="h-10 w-60 rounded bg-gray-200" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-11 rounded bg-gray-200" />
              <div className="h-11 rounded bg-gray-200" />
            </div>
          </Card>

          <div className="space-y-4">
            <div className="h-6 w-48 rounded bg-gray-200" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse bg-gray-100" />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-6 w-56 rounded bg-gray-200" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-60 animate-pulse bg-gray-100" />
              ))}
            </div>
            <div className="mx-auto h-10 w-64 rounded-full bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="p-6 text-center text-red-500">
        {t("eventsPage.errorLoading")}
      </p>
    );
  }

  const hasNoMatches = ongoing.length === 0 && upcoming.length === 0;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-10">
        <EventsHeader
          ongoingCount={ongoing.length}
          upcomingCount={upcoming.length}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedRegion={selectedRegion}
          onRegionChange={handleRegionChange}
          regions={REGIONS}
        />

        <OngoingCarousel events={ongoing} />

        <UpcomingGrid
          events={upcoming}
          hasNoMatches={hasNoMatches}
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}
