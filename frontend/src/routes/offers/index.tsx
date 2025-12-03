import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/PaginationControls";
import { apiFetch } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
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
import type { PaginatedResponse } from "@/types/pagination";
import { Sparkles, Tag, Search } from "lucide-react";

export const Route = createFileRoute("/offers/")({
  component: OffersAllPage,
  validateSearch: (search: Record<string, unknown>) => {
    const parsedSearch =
      typeof search.search === "string" && search.search.trim()
        ? search.search.trim()
        : undefined;
    const parsedCategory =
      typeof search.category === "string" && search.category.trim()
        ? search.category.trim()
        : undefined;

    return {
      page: Math.max(1, Number(search.page) || 1),
      search: parsedSearch,
      category: parsedCategory,
    };
  },
});

type Offer = {
  id: number;
  title: string;
  description?: string;
  category: string;
  price: number;
  user: {
    id: number;
    name: string;
  };
  product: {
    id: number;
    name: string;
    category: string;
    basePrice?: number;
    description?: string;
    images?: { url: string; publicId: string }[];
  };
};

function OffersAllPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page, search, category } = Route.useSearch();
  const [searchTerm, setSearchTerm] = useState(search ?? "");
  const [selectedCategory, setSelectedCategory] = useState(
    category ?? "all"
  );

  useEffect(() => {
    document.title = `${t("offers")} | ${t("farmly")}`;
  }, [t]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  useEffect(() => {
    setSearchTerm(search ?? "");
  }, [search]);

  useEffect(() => {
    setSelectedCategory(category ?? "all");
  }, [category]);

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed === (search ?? "")) return;

    const timeout = setTimeout(() => {
      navigate({
        to: "/offers",
        search: {
          page: 1,
          search: trimmed || undefined,
          category: selectedCategory === "all" ? undefined : selectedCategory,
        },
      });
    }, 350);

    return () => clearTimeout(timeout);
  }, [navigate, search, searchTerm, selectedCategory]);

  const handleCategoryChange = (value: string) => {
    const nextCategory = value === "all" ? undefined : value;
    setSelectedCategory(value);
    navigate({
      to: "/offers",
      search: {
        page: 1,
        search: searchTerm.trim() || undefined,
        category: nextCategory,
      },
    });
  };

  const {
    data,
    isLoading,
    isError,
  } = useQuery<PaginatedResponse<Offer>>({
    queryKey: ["offersAll", page, search, category],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(DEFAULT_PAGE_SIZE),
      });

      if (search) params.append("search", search);
      if (category) params.append("category", category);

      return apiFetch(`/offer/all?${params.toString()}`);
    },
    placeholderData: keepPreviousData,
  });

  const offers = useMemo(() => data?.items ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(nextPage, totalPages || nextPage));
    navigate({
      to: "/offers",
      search: {
        page: safePage,
        search: search ?? undefined,
        category: selectedCategory === "all" ? undefined : selectedCategory,
      },
    });
  };

  const filteredOffers = useMemo(() => {
    const term = search?.toLowerCase();
    const hasSearch = Boolean(term);
    const categoryFilter =
      selectedCategory !== "all" ? selectedCategory : undefined;

    return offers.filter((offer: Offer) => {
      const matchesCategory = categoryFilter
        ? offer.category === categoryFilter
        : true;
      const matchesSearch = hasSearch
        ? [offer.title, offer.description, offer.user?.name, offer.product?.name]
            .filter(Boolean)
            .some((value) => value?.toLowerCase().includes(term!))
        : true;

      return matchesCategory && matchesSearch;
    });
  }, [offers, search, selectedCategory]);

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
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-60 animate-pulse bg-gray-100" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="p-6 text-center text-red-500">
        {t("offersPage.errorLoading")}
      </p>
    );
  }

  if (offers.length === 0) {
    return (
      <p className="p-6 text-center text-gray-500">
        {t("offersPage.noOffers")}
      </p>
    );
  }

  const hasNoMatches = filteredOffers.length === 0;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-white to-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">
                <Tag className="h-4 w-4" />
                {t("offersPage.title")}
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h1 className="text-3xl font-bold">{t("offersPage.title")}</h1>
              </div>
              <p className="max-w-2xl text-sm text-gray-600">
                {t("offersPage.subtitle")}
              </p>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 text-xs font-medium text-gray-700 shadow-sm">
              {t("offersPage.totalOffers", { count: offers.length })}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1.5fr_1fr]">
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("offersPage.searchPlaceholder")}
                className="w-full pr-10"
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="flex gap-2 sm:justify-end">
              <Select
                value={selectedCategory}
                onValueChange={(value) => handleCategoryChange(value)}
              >
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue
                    placeholder={t("offersPage.categoryPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("offersPage.categoryAll")}
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
        </Card>

        {hasNoMatches ? (
          <Card className="border-dashed bg-white/70 p-6 text-center text-gray-500">
            {t("offersPage.noResults")}
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOffers.map((offer: Offer) => (
                <Link
                  key={offer.id}
                  to="/offers/$id"
                  params={{ id: String(offer.id) }}
                >
                  <Card className="group h-full overflow-hidden border border-gray-100 bg-white/80 transition hover:-translate-y-1 hover:shadow-lg">
                    {offer.product?.images?.[0]?.url ? (
                      <div className="relative h-40 w-full overflow-hidden">
                        <img
                          src={offer.product.images[0].url}
                          alt={offer.title}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur">
                          {getCategoryLabel(offer.category, t)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
                        {t("offersPage.noImage")}
                      </div>
                    )}
                    <div className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold leading-tight">
                          {offer.title}
                        </h3>
                        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                          {offer.price} €
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm text-gray-600">
                        {offer.description || t("offersPage.noDescription")}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {t("offersPage.by")} {offer.user.name}
                        </span>
                        {offer.product?.name ? (
                          <span className="rounded-full bg-gray-100 px-3 py-1">
                            {offer.product.name}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              prevLabel={t("pagination.previous")}
              nextLabel={t("pagination.next")}
              className="pt-2"
            />
          </>
        )}
      </div>
    </div>
  );
}
