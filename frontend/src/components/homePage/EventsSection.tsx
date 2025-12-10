import { Link } from "@tanstack/react-router";
import { CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Event } from "@/types/events";
import type { NavLink } from "./HeroSection";

type EventsSectionProps = {
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaLink: NavLink;
  events: Event[];
  loading: boolean;
  error: boolean;
  emptyText: string;
  noDescriptionText: string;
  ongoingLabel: string;
  getEventStatus: (event: Event) => string;
  formatDateRange: (startDate: string, endDate: string) => string;
};

export function EventsSection({
  label,
  title,
  description,
  ctaLabel,
  ctaLink,
  events,
  loading,
  error,
  emptyText,
  noDescriptionText,
  ongoingLabel,
  getEventStatus,
  formatDateRange,
}: EventsSectionProps) {
  const sectionClasses = "space-y-4 rounded-3xl border bg-white p-6 shadow-sm";

  if (loading) {
    return (
      <section className={sectionClasses}>
        <HeaderBlock
          label={label}
          title={title}
          description={description}
          ctaLabel={ctaLabel}
          ctaLink={ctaLink}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card
              key={idx}
              className="h-40 animate-pulse border border-primary/10 bg-white"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error || events.length === 0) {
    return (
      <section className={sectionClasses}>
        <HeaderBlock
          label={label}
          title={title}
          description={description}
          ctaLabel={ctaLabel}
          ctaLink={ctaLink}
        />
        <p className="rounded-2xl border bg-white p-4 text-sm text-muted-foreground">
          {emptyText}
        </p>
      </section>
    );
  }

  return (
    <section className={sectionClasses}>
      <HeaderBlock
        label={label}
        title={title}
        description={description}
        ctaLabel={ctaLabel}
        ctaLink={ctaLink}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const status = getEventStatus(event);
          const statusClass =
            status === ongoingLabel
              ? "bg-green-100 text-green-700"
              : "bg-amber-100 text-amber-700";

          return (
            <Card
              key={event.id}
              className="group h-full border border-primary/10 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <CalendarDays className="h-4 w-4" />
                  <span>{formatDateRange(event.startDate, event.endDate)}</span>
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
                {event.description || noDescriptionText}
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
    </section>
  );
}

type HeaderBlockProps = {
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaLink: NavLink;
};

function HeaderBlock({
  label,
  title,
  description,
  ctaLabel,
  ctaLink,
}: HeaderBlockProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
          {label}
        </p>
        <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <Button
        asChild
        variant="ghost"
        className="border-primary/40 text-primary hover:bg-primary/10"
      >
        <Link to={ctaLink.to} search={ctaLink.search}>
          {ctaLabel}
        </Link>
      </Button>
    </div>
  );
}
