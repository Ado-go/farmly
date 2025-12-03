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
import { Search } from "lucide-react";

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {Array.from({ length: 6 })?.map((_, i) => (
          <Card key={i} className="animate-pulse h-40" />
        ))}
        <p className="col-span-full text-center text-gray-500 mt-4">
          {t("farmsPage.loading")}
        </p>
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
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-3">{farm.name}</h2>

      {carouselImages.length > 0 ? (
        <div className="mb-5">
          <ImageCarousel
            images={carouselImages}
            editable={false}
            height="h-64"
            emptyLabel={t("farmsPage.noImage")}
          />
        </div>
      ) : (
        <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded mb-5">
          <span className="text-gray-500">{t("farmsPage.noImage")}</span>
        </div>
      )}

      {farm.description && (
        <p className="mb-3 text-gray-700">{farm.description}</p>
      )}
      <p className="text-sm text-gray-600">
        {farm.street}, {farm.city}, {farm.region}, {farm.postalCode},{" "}
        {farm.country}
      </p>
      <div className="mt-4 flex items-center gap-3">
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

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        {t("farmsPage.products")}
      </h3>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
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
          <SelectTrigger className="w-full sm:w-60">
            <SelectValue placeholder={t("farmsPage.filterByCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("farmsPage.allCategories")}</SelectItem>
            {PRODUCT_CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {getCategoryLabel(cat, t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredProducts?.length === 0 ? (
        <p className="text-gray-500">{t("farmsPage.noProducts")}</p>
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

          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            prevLabel={t("pagination.previous")}
            nextLabel={t("pagination.next")}
            className="pt-4"
          />
        </>
      )}
    </div>
  );
}
