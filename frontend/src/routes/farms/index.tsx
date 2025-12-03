import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
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
import { Search, Sprout } from "lucide-react";

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
      <div className="p-6 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="h-10 w-full sm:w-64 bg-gray-100 rounded animate-pulse" />
            <div className="h-10 w-full sm:w-48 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        <div className="space-y-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Card key={j} className="p-4 space-y-3">
                    <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
                    <div className="h-32 w-full bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                  </Card>
                ))}
              </div>
            </div>
          ))}
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

  return (
    <div className="p-6 space-y-10">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-emerald-600" />
            <h2 className="text-2xl font-bold">{t("farmsPage.title")}</h2>
          </div>
          <p className="text-sm text-gray-600">{t("farmsPage.subtitle")}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
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
            <SelectTrigger className="w-full sm:w-48">
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
      </div>

      {farmers?.length === 0 ? (
        <p className="text-gray-500">
          {hasFilters ? t("farmsPage.noFilteredFarms") : t("farmsPage.noFarms")}
        </p>
      ) : (
        farmers.map(({ farmer, farms }) => (
          <div key={farmer.id}>
            <div className="flex items-center space-x-3 mb-4">
              <ProfileAvatar
                imageUrl={farmer.profileImageUrl}
                name={farmer.name}
                size={40}
              />
              <span className="font-semibold">{farmer.name}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {farms.map((farm) => (
                <Link
                  key={farm.id}
                  to="/farms/$id"
                  params={{ id: String(farm.id) }}
                  search={{ page: 1, category, search }}
                >
                  <Card className="p-4 hover:shadow-lg transition">
                    <h3 className="font-bold">{farm.name}</h3>

                    {farm.images?.[0]?.url ? (
                      <img
                        src={farm.images[0].url}
                        alt={farm.name}
                        className="w-full h-32 object-cover mt-2 rounded"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-500 mt-2 rounded">
                        {t("farmsPage.noImage")}
                      </div>
                    )}

                    <p className="text-sm mt-2">
                      {farm.farmProducts?.length || 0} {t("farmsPage.products")}
                    </p>

                    {farm.farmProducts?.length > 0 && (
                      <ul className="text-xs text-gray-600 mt-1">
                        {farm.farmProducts.slice(0, 2).map((fp) => (
                          <li key={fp.id}>
                            • {fp.product.name} (
                            {getCategoryLabel(fp.product.category, t)})
                          </li>
                        ))}
                        {farm.farmProducts?.length > 2 && <li>…</li>}
                      </ul>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))
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
  );
}
