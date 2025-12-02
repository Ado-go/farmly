import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ProductCard } from "@/components/ProductCard";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/PaginationControls";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  PRODUCT_CATEGORIES,
  getCategoryLabel,
} from "@/lib/productCategories";
import type { PaginatedResponse } from "@/types/pagination";
import {
  ArrowUpNarrowWide,
  ArrowDownWideNarrow,
  Apple,
  Carrot,
  Drumstick,
  Milk,
  Croissant,
  CupSoda,
  Package,
} from "lucide-react";

const SORT_OPTIONS = ["newest", "price", "rating", "popular"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const isSortOption = (value: unknown): value is SortOption =>
  typeof value === "string" && SORT_OPTIONS.includes(value as SortOption);

const ORDER_DIRECTIONS = ["asc", "desc"] as const;
type OrderDirection = (typeof ORDER_DIRECTIONS)[number];

const isOrderDirection = (value: unknown): value is OrderDirection =>
  typeof value === "string" &&
  ORDER_DIRECTIONS.includes(value as OrderDirection);

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Fruits: Apple,
  Vegetables: Carrot,
  Meat: Drumstick,
  Dairy: Milk,
  Bakery: Croissant,
  Drinks: CupSoda,
  Other: Package,
};

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
  validateSearch: (search: Record<string, unknown>) => {
    const parsedSort = isSortOption(search.sort)
      ? (search.sort as SortOption)
      : "newest";

    return {
      page: Math.max(1, Number(search.page) || 1),
      sort: parsedSort,
      category:
        typeof search.category === "string" && search.category.trim()
          ? search.category.trim()
          : undefined,
      order: isOrderDirection(search.order)
        ? (search.order as OrderDirection)
        : parsedSort === "price"
          ? "asc"
          : "desc",
      search:
        typeof search.search === "string" && search.search.trim()
          ? search.search.trim()
          : undefined,
    };
  },
});

type FarmProduct = {
  id: number;
  price: number;
  stock: number;
  farm?: { id: number; name: string };
  product: {
    id: number;
    name: string;
    category: string;
    description?: string;
    rating?: number;
    images?: { url: string }[];
    reviews?: { rating: number }[];
  };
};

function ProductsPage() {
  const { t } = useTranslation();
  const { page, category, sort, order, search } = Route.useSearch();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(search ?? "");

  useEffect(() => {
    document.title = `${t("products")} | ${t("farmly")}`;
  }, [t]);
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
        to: "/products",
        search: {
          page: 1,
          category,
          sort,
          order,
          search: nextSearch,
        },
      });
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchTerm, category, sort, order, navigate, search]);

  const {
    data,
    isLoading,
    isError,
  } = useQuery<PaginatedResponse<FarmProduct>>({
    queryKey: ["farmProducts", page, category, sort, order, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(DEFAULT_PAGE_SIZE),
        sort,
        order,
      });

      if (category) params.append("category", category);
      if (search) params.append("search", search);

      return apiFetch(`/public-farm-products?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const farmProducts = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(nextPage, totalPages || nextPage));
    const nextSearch = search ?? undefined;
    navigate({
      to: "/products",
      search: {
        page: safePage,
        category,
        sort,
        order,
        search: nextSearch,
      },
    });
  };

  const handleCategoryChange = (selected?: string) => {
    const nextSearch = searchTerm.trim() || undefined;
    navigate({
      to: "/products",
      search: {
        page: 1,
        category: selected,
        sort,
        order,
        search: nextSearch,
      },
    });
  };

  const handleSortChange = (selected: SortOption) => {
    const nextSearch = searchTerm.trim() || undefined;
    navigate({
      to: "/products",
      search: {
        page: 1,
        category,
        sort: selected,
        order,
        search: nextSearch,
      },
    });
  };

  const toggleOrder = () => {
    const nextSearch = searchTerm.trim() || undefined;
    const nextOrder: OrderDirection = order === "asc" ? "desc" : "asc";
    navigate({
      to: "/products",
      search: {
        page: 1,
        category,
        sort,
        order: nextOrder,
        search: nextSearch,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">{t("productsPage.title")}</h2>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <Card className="p-4 h-fit space-y-2">
            <p className="text-lg font-semibold">
              {t("productsPage.categories")}
            </p>
            <div className="h-6 bg-gray-200 rounded" />
            {PRODUCT_CATEGORIES.map((cat) => (
              <div key={cat} className="h-6 bg-gray-100 rounded" />
            ))}
          </Card>

          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {t("productsPage.sortBy")}
                </span>
                <div className="w-48 h-10 bg-gray-200 rounded" />
                <div className="w-10 h-10 bg-gray-200 rounded" />
              </div>
              <div className="w-full md:w-72 h-10 bg-gray-200 rounded" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-40 bg-gray-200 rounded-t-2xl" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded" />
                    <div className="h-4 bg-gray-200 w-1/2 rounded" />
                  </div>
                </Card>
              ))}
            </div>
            <p className="text-center text-gray-500">
              {t("productsPage.loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-red-500 p-6">{t("productsPage.error")}</p>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">{t("productsPage.title")}</h2>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <Card className="p-4 h-fit">
          <p className="text-lg font-semibold mb-3">
            {t("productsPage.categories")}
          </p>
          <div className="space-y-2">
            <button
              className={`w-full text-left px-3 py-2 rounded-md border transition ${
                !category
                  ? "border-primary text-primary bg-primary/5"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
              onClick={() => handleCategoryChange(undefined)}
            >
              {t("productsPage.allCategories")}
            </button>
            {PRODUCT_CATEGORIES.map((cat) => {
              const active = category === cat;
              const Icon = CATEGORY_ICONS[cat];
              return (
                <button
                  key={cat}
                  className={`w-full text-left px-3 py-2 rounded-md border transition ${
                    active
                      ? "border-primary text-primary bg-primary/5"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => handleCategoryChange(cat)}
                >
                  <span className="flex items-center gap-2">
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {getCategoryLabel(cat, t)}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {t("productsPage.sortBy")}
              </span>
              <Select value={sort} onValueChange={(v) => handleSortChange(v as SortOption)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={t("productsPage.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    {t("productsPage.sortOptions.newest")}
                  </SelectItem>
                  <SelectItem value="price">
                    {t("productsPage.sortOptions.price")}
                  </SelectItem>
                  <SelectItem value="rating">
                    {t("productsPage.sortOptions.rating")}
                  </SelectItem>
                  <SelectItem value="popular">
                    {t("productsPage.sortOptions.popular")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className={`h-10 w-10 ${order === "asc" ? "bg-primary/5 border-primary text-primary" : ""}`}
                onClick={toggleOrder}
                aria-label={t("productsPage.orderDirection")}
                title={`${t("productsPage.orderDirection")}: ${t(`productsPage.orderOptions.${order}`)}`}
              >
                {order === "asc" ? (
                  <ArrowUpNarrowWide className="h-4 w-4" />
                ) : (
                  <ArrowDownWideNarrow className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="w-full md:w-72">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("productsPage.searchPlaceholder")}
              />
            </div>
          </div>

          {farmProducts.length === 0 ? (
            <p className="text-gray-500">{t("productsPage.noProducts")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {farmProducts.map((fp: FarmProduct) => (
                <ProductCard key={fp.id} product={fp} />
              ))}
            </div>
          )}

          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            prevLabel={t("pagination.previous")}
            nextLabel={t("pagination.next")}
            className="pt-2"
          />
        </div>
      </div>
    </div>
  );
}
