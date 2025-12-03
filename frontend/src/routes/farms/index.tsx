import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { PaginationControls } from "@/components/PaginationControls";
import { apiFetch } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { PRODUCT_CATEGORIES, getCategoryLabel } from "@/lib/productCategories";
import type { PaginatedResponse } from "@/types/pagination";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Sprout, Leaf, MapPin } from "lucide-react";

export const Route = createFileRoute("/farms/")({
  component: FarmsPage,
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

type Farm = {
  id: number;
  name: string;
  images: { url: string }[];
  city?: string;
  street?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  farmProducts: {
    id: number;
    price: number;
    product: {
      id: number;
      name: string;
      category: string;
    };
  }[];
  farmer: {
    id: number;
    name: string;
    profileImageUrl?: string | null;
  };
};

function FarmsPage() {
  const { t } = useTranslation();
  const { page, category, search } = Route.useSearch();
  const [searchTerm, setSearchTerm] = useState(search ?? "");
  useEffect(() => {
    document.title = `${t("farms")} | ${t("farmly")}`;
  }, [t]);

  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    setSearchTerm(search ?? "");
  }, [search]);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed === (search ?? "")) return;

    const timeout = setTimeout(() => {
      const nextSearch = trimmed || undefined;
      navigate({
        to: "/farms",
        search: {
          page: 1,
          category,
          search: nextSearch,
        },
      });
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchTerm, category, navigate, search]);

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Farm>>({
    queryKey: ["farms", page, category, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(DEFAULT_PAGE_SIZE),
      });

      if (category) params.append("category", category);
      if (search) params.append("search", search);

      return apiFetch(`/farms?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const farms = data?.items ?? [];
  const totalItems = data?.total ?? farms.length;
  const totalPages = data?.totalPages ?? 1;

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(nextPage, totalPages || nextPage));
    navigate({
      to: "/farms",
      search: { page: safePage, category, search },
    });
  };

  const handleCategoryChange = (selected?: string) => {
    const nextSearch = searchTerm.trim() || undefined;
    navigate({
      to: "/farms",
      search: { page: 1, category: selected, search: nextSearch },
    });
  };

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

          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-gray-100 bg-white/70 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="space-y-2">
                    <div className="h-4 w-28 bg-gray-200 rounded" />
                    <div className="h-3 w-20 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Card key={j} className="h-48 bg-gray-100" />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-red-500 p-6">
        {t("farmsPage.errorLoading")}
      </p>
    );
  }

  const farmersMap: Record<number, { farmer: Farm["farmer"]; farms: Farm[] }> =
    {};
  farms.forEach((farm: Farm) => {
    if (!farm.farmer) return;

    const farmerId = farm.farmer.id;
    if (!farmersMap[farmerId]) {
      farmersMap[farmerId] = { farmer: farm.farmer, farms: [] };
    }
    farmersMap[farmerId].farms.push(farm);
  });

  const farmers = Object.values(farmersMap);

  const hasFilters = Boolean(category || search);
  const formatLocation = (farm: Farm) => {
    const regionPart = farm.region
      ? t("farmsPage.regionDisplay", { region: farm.region })
      : "";
    const primary = [farm.city, regionPart].filter(Boolean).join(" • ");
    const secondary = [farm.street, farm.postalCode, farm.country]
      .filter((part) => part && String(part).trim())
      .join(", ");

    if (!primary && !secondary) {
      return { primary: t("farmsPage.locationUnknown"), secondary: "" };
    }

    return { primary: primary || secondary, secondary: primary ? secondary : "" };
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-white to-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">
                <Sprout className="h-4 w-4" />
                {t("farmsPage.title")}
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                <h1 className="text-3xl font-bold">{t("farmsPage.title")}</h1>
              </div>
              <p className="max-w-2xl text-sm text-gray-600">
                {t("farmsPage.subtitle")}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-700">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                {t("farmsPage.total", { count: totalItems })}
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                {t("farmsPage.activeCategory", {
                  category: category
                    ? getCategoryLabel(category, t)
                    : t("farmsPage.allCategories"),
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1.5fr_1fr]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("farmsPage.searchPlaceholder")}
                className="pl-10"
              />
            </div>

            <Select
              value={category ?? "all"}
              onValueChange={(value) =>
                handleCategoryChange(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder={t("farmsPage.filterByCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("farmsPage.allCategories")}
                </SelectItem>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {getCategoryLabel(cat, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {farmers?.length === 0 ? (
          <Card className="border-dashed bg-white/70 p-6 text-center text-gray-500">
            {hasFilters ? t("farmsPage.noFilteredFarms") : t("farmsPage.noFarms")}
          </Card>
        ) : (
          <div className="space-y-8">
            {farmers.map(({ farmer, farms }) => (
              <Card
                key={farmer.id}
                className="border-gray-100 bg-white/80 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      imageUrl={farmer.profileImageUrl}
                      name={farmer.name}
                      size={44}
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {farmer.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("farmsPage.farmer")}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {t("farmsPage.products")}:{" "}
                    {farms.reduce(
                      (sum, f) => sum + (f.farmProducts?.length ?? 0),
                      0
                    )}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {farms.map((farm) => (
                    <Link
                      key={farm.id}
                      to="/farms/$id"
                      params={{ id: String(farm.id) }}
                      search={{ page: 1, category, search }}
                    >
                      <Card className="group h-full overflow-hidden border border-gray-100 bg-white transition hover:-translate-y-1 hover:shadow-lg">
                        <div className="relative h-36 w-full overflow-hidden">
                          {farm.images?.[0]?.url ? (
                            <img
                              src={farm.images[0].url}
                              alt={farm.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
                              {t("farmsPage.noImage")}
                            </div>
                          )}
                          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur">
                            {t("farmsPage.products")}:{" "}
                            {farm.farmProducts?.length ?? 0}
                          </span>
                        </div>
                        <CardContent className="space-y-2 p-4">
                          <h3 className="text-lg font-semibold leading-tight">
                            {farm.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                            {farm.farmProducts?.slice(0, 3).map((fp) => (
                              <span
                                key={fp.id}
                                className="rounded-full bg-primary/10 px-3 py-1 text-primary"
                              >
                                {fp.product.name}
                              </span>
                            ))}
                            {farm.farmProducts &&
                            farm.farmProducts.length > 3 ? (
                              <span className="text-gray-500">
                                +{farm.farmProducts.length - 3}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex items-start gap-2 text-xs text-gray-500">
                            <MapPin className="h-4 w-4 text-primary mt-0.5" />
                            {(() => {
                              const { primary, secondary } = formatLocation(farm);
                              return (
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-gray-700">
                                    {primary}
                                  </p>
                                  {secondary ? (
                                    <p className="text-gray-500">{secondary}</p>
                                  ) : null}
                                </div>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        <PaginationControls
          page={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          prevLabel={t("pagination.previous")}
          nextLabel={t("pagination.next")}
          className="pt-4"
        />
      </div>
    </div>
  );
}
