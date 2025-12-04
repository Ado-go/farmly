import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductCard } from "@/components/ProductCard";
import type { FarmProduct } from "@/types/farm";
import type { NavLink } from "./HeroSection";

type ProductsSectionProps = {
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaLink: NavLink;
  products: FarmProduct[];
  loading: boolean;
  error: boolean;
  emptyText: string;
};

export function ProductsSection({
  label,
  title,
  description,
  ctaLabel,
  ctaLink,
  products,
  loading,
  error,
  emptyText,
}: ProductsSectionProps) {
  return (
    <section className="space-y-4 rounded-3xl border bg-card/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            {label}
          </p>
          <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <Button asChild variant="outline">
          <Link to={ctaLink.to} search={ctaLink.search}>
            {ctaLabel}
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card
              key={idx}
              className="h-64 animate-pulse border border-primary/10 bg-white/70"
            />
          ))}
        </div>
      ) : error || products.length === 0 ? (
        <p className="rounded-2xl border bg-card/60 p-4 text-sm text-muted-foreground">
          {emptyText}
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
  );
}
