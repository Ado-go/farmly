import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ProductCard } from "@/components/ProductCard";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { ImageCarousel } from "@/components/ImageCarousel";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import {
  PRODUCT_CATEGORIES,
  getCategoryLabel,
} from "@/lib/productCategories";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaginationControls } from "@/components/PaginationControls";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { Leaf, MapPin, Search, Sprout } from "lucide-react";

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

type FarmProduct = {
  id: number;
  price: number;
  stock: number;
  product: {
    id: number;
    name: string;
    category: string;
    description?: string;
    rating?: number;
    images: { url: string }[];
    reviews?: { rating: number }[];
  };
};

type FarmDetail = {
  id: number;
  name: string;
  description?: string;
  city: string;
  street: string;
  region: string;
  postalCode: string;
  country: string;
  images?: { url: string; optimizedUrl?: string }[];
  farmer?: { id: number; name: string; profileImageUrl?: string | null };
  farmProducts: FarmProduct[];
};

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

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-white to-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">
                <Sprout className="h-4 w-4" />
                {t("farmsPage.title")}
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-primary" />
                <h2 className="text-3xl font-bold">{farm.name}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-semibold text-gray-800">
                  {location.primary}
                </span>
                {location.secondary ? (
                  <span className="text-gray-500">• {location.secondary}</span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-medium text-gray-700">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                {t("farmsPage.products")}: {productCount}
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                {t("farmsPage.farmer")}:{" "}
                {farm.farmer?.name || t("farmsPage.unknownFarmer")}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-0 overflow-hidden border-primary/15 shadow-sm">
            {carouselImages.length > 0 ? (
              <ImageCarousel
                images={carouselImages}
                editable={false}
                height="h-72"
                emptyLabel={t("farmsPage.noImage")}
              />
            ) : (
              <div className="flex h-72 w-full items-center justify-center bg-primary/5 text-primary">
                {t("farmsPage.noImage")}
              </div>
            )}
          </Card>

          <Card className="space-y-4 border-primary/15 bg-white/90 p-5 shadow-sm">
            {farm.description ? (
              <p className="text-sm text-gray-700 leading-relaxed">
                {farm.description}
              </p>
            ) : null}

            <div className="flex items-start gap-3 text-sm text-gray-700">
              <MapPin className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold text-gray-800">
                  {location.primary}
                </p>
                {location.secondary ? (
                  <p className="text-gray-500">{location.secondary}</p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-primary/5 px-3 py-2">
              <ProfileAvatar
                imageUrl={farm.farmer?.profileImageUrl}
                name={farm.farmer?.name}
                size={48}
              />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t("farmsPage.farmer")}
                </p>
                <p className="font-semibold text-emerald-700">
                  {farm.farmer?.name || t("farmsPage.unknownFarmer")}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-semibold text-primary">
              <span className="rounded-full bg-primary/10 px-3 py-1">
                {t("farmsPage.products")}: {productCount}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-gray-700 shadow-sm">
                {t("farmsPage.activeCategory", {
                  category: category
                    ? getCategoryLabel(category, t)
                    : t("farmsPage.allCategories"),
                })}
              </span>
            </div>
          </Card>
        </div>

        <Card className="space-y-5 border-primary/15 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">
                {t("farmsPage.products")}
              </h3>
              <p className="text-sm text-gray-500">
                {t("farmsPage.activeCategory", {
                  category: category
                    ? getCategoryLabel(category, t)
                    : t("farmsPage.allCategories"),
                })}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t("productsPage.searchPlaceholder")}
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
                  <SelectValue
                    placeholder={t("farmsPage.filterByCategory")}
                  />
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
          </div>

          {filteredProducts?.length === 0 ? (
            <div className="rounded-lg border border-dashed border-primary/20 bg-primary/5 p-6 text-center text-gray-500">
              {t("farmsPage.noProducts")}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {paginatedProducts.map((fp) => (
                  <ProductCard
                    key={fp.id}
                    product={fp}
                    sellerNameOverride={farm.name}
                  />
                ))}
              </div>

              {totalPages > 1 ? (
                <PaginationControls
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  prevLabel={t("pagination.previous")}
                  nextLabel={t("pagination.next")}
                  className="pt-2"
                />
              ) : null}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
