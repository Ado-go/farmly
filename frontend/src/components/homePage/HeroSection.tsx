import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type StatItem = {
  icon: LucideIcon;
  label: string;
  value?: number;
};

export type NavLink = {
  to: string;
  search?: Record<string, unknown>;
};

type HeroSectionProps = {
  title: string;
  description: string;
  ctaProductsLabel: string;
  ctaEventsLabel: string;
  productsLink: NavLink;
  eventsLink: NavLink;
  statsItems: StatItem[];
  formatStat: (value?: number) => string;
};

export function HeroSection({
  title,
  description,
  ctaProductsLabel,
  ctaEventsLabel,
  productsLink,
  eventsLink,
  statsItems,
  formatStat,
}: HeroSectionProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card/80 p-8 shadow-sm">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-transparent to-secondary/20" />
      <div className="space-y-5">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          {description}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to={productsLink.to} search={productsLink.search}>
              {ctaProductsLabel}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-primary/40 text-primary hover:bg-primary/10"
          >
            <Link to={eventsLink.to} search={eventsLink.search}>
              {ctaEventsLabel}
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
  );
}
