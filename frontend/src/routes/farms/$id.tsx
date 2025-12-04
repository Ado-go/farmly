import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { getCategoryLabel } from "@/lib/productCategories";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { FarmDetailHero } from "@/components/farms/FarmDetailHero";
import { FarmGalleryCard } from "@/components/farms/FarmGalleryCard";
import { FarmOverviewCard } from "@/components/farms/FarmOverviewCard";
import { FarmProductsSection } from "@/components/farms/FarmProductsSection";
import type { Farm, FarmProduct } from "@/types/farm";

export const Route = createFileRoute("/farms/$id")({
  component: FarmDetailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Math.max(1, Number(search.page) || 1),
    category:
      typeof search.category === "string" && search.category.trim()
        ? search.category.trim()
        : undefined,
    search:
      typeof search.search === "string" && search.search.trim()
        ? search.search.trim()
        : undefined,
  }),
});

type FarmDetail = Farm & { farmProducts: FarmProduct[] };

function FarmDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const { page, category, search } = Route.useSearch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(search ?? "");

  const {
    data: farm,
    isLoading,
    isError,
  } = useQuery<FarmDetail>({
    queryKey: ["farm-public", id],
    queryFn: async () => apiFetch(`/farms/${id}`),
  });

  useEffect(() => {
    if (farm?.name) {
      document.title = `${farm.name} | ${t("farmly")}`;
    }
  }, [farm?.name, t]);

  useEffect(() => {
    setSearchTerm(search ?? "");
  }, [search]);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      const safePage = Math.max(1, nextPage);
      navigate({
        to: "/farms/$id",
        params: { id },
        search: { page: safePage, category, search },
      });
    },
    [navigate, id, category, search]
  );

  const handleCategoryChange = useCallback(
    (selected?: string) => {
      navigate({
        to: "/farms/$id",
        params: { id },
        search: { page: 1, category: selected, search },
      });
    },
    [navigate, id, search]
  );

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed === (search ?? "")) return;

    const timeout = setTimeout(() => {
      const nextSearch = trimmed || undefined;
      navigate({
        to: "/farms/$id",
        params: { id },
        search: { page: 1, category, search: nextSearch },
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchTerm, category, navigate, search, id]);

  const formatLocation = useCallback(
    (currentFarm: FarmDetail) => {
      const regionPart = currentFarm.region
        ? t("farmsPage.regionDisplay", { region: currentFarm.region })
        : "";
      const primary = [currentFarm.city, regionPart].filter(Boolean).join(" • ");
      const secondary = [currentFarm.street, currentFarm.postalCode, currentFarm.country]
        .filter((part) => part && String(part).trim())
        .join(", ");

      if (!primary && !secondary) {
        return { primary: t("farmsPage.locationUnknown"), secondary: "" };
      }

      return { primary: primary || secondary, secondary: primary ? secondary : "" };
    },
    [t]
  );

  const filteredProducts = useMemo(() => {
    if (!farm?.farmProducts) return [];
    const term = (search ?? "").toLowerCase();

    return farm.farmProducts.filter((fp) => {
      const matchesCategory = category ? fp.product.category === category : true;
      const matchesSearch = term
        ? fp.product.name.toLowerCase().includes(term)
        : true;
      return matchesCategory && matchesSearch;
    });
  }, [farm?.farmProducts, category, search]);

  const totalPages = Math.max(
    1,
    Math.ceil((filteredProducts?.length ?? 0) / DEFAULT_PAGE_SIZE)
  );
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      handlePageChange(totalPages);
    }
  }, [page, totalPages, handlePageChange]);

  const startIndex = (currentPage - 1) * DEFAULT_PAGE_SIZE;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + DEFAULT_PAGE_SIZE
  );

  const location = useMemo(
    () => (farm ? formatLocation(farm) : { primary: "", secondary: "" }),
    [farm, formatLocation]
  );
  const productCount = farm?.farmProducts?.length ?? 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <Card className="border-primary/20 bg-white/80 p-6 shadow-sm space-y-4 animate-pulse">
            <div className="h-6 w-32 rounded bg-gray-200" />
            <div className="h-8 w-2/3 rounded bg-gray-200" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="h-44 rounded bg-gray-200" />
              <div className="h-44 rounded bg-gray-200" />
            </div>
          </Card>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="h-44 bg-gray-100 animate-pulse" />
            ))}
          </div>
          <p className="text-center text-gray-500">{t("farmsPage.loading")}</p>
        </div>
      </div>
    );
  }

  if (isError || !farm) {
    return (
      <p className="text-center text-red-500 p-6">{t("farmsPage.error")}</p>
    );
  }

  const carouselImages =
    farm.images?.map((img) => ({
      url: img.optimizedUrl || img.url,
    })) ?? [];

  const activeCategoryLabel = category
    ? getCategoryLabel(category, t)
    : t("farmsPage.allCategories");

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <FarmDetailHero
          name={farm.name}
          location={location}
          productCount={productCount}
          farmerName={farm.farmer?.name}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <FarmGalleryCard images={carouselImages} />

          <FarmOverviewCard
            description={farm.description}
            location={location}
            farmer={farm.farmer}
            productCount={productCount}
            activeCategoryLabel={activeCategoryLabel}
          />
        </div>

        <FarmProductsSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          category={category}
          onCategoryChange={handleCategoryChange}
          paginatedProducts={paginatedProducts}
          filteredCount={filteredProducts.length}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          activeCategoryLabel={activeCategoryLabel}
          farmName={farm.name}
        />
      </div>
    </div>
  );
}
