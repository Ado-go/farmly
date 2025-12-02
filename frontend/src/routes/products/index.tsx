import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ProductCard } from "@/components/ProductCard";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/PaginationControls";
import { apiFetch } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type { PaginatedResponse } from "@/types/pagination";

export const Route = createFileRoute("/products/")({
  component: ProductsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Math.max(1, Number(search.page) || 1),
  }),
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
  const { page } = Route.useSearch();
  const navigate = useNavigate();
  useEffect(() => {
    document.title = `${t("products")} | ${t("farmly")}`;
  }, [t]);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const {
    data,
    isLoading,
    isError,
  } = useQuery<PaginatedResponse<FarmProduct>>({
    queryKey: ["farmProducts", page],
    queryFn: async () =>
      apiFetch(
        `/public-farm-products?page=${page}&limit=${DEFAULT_PAGE_SIZE}`
      ),
    placeholderData: keepPreviousData,
  });

  const farmProducts = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(nextPage, totalPages || nextPage));
    navigate({ to: "/products", search: { page: safePage } });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-40 bg-gray-200 rounded-t-2xl" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 w-1/2 rounded" />
            </div>
          </Card>
        ))}
        <p className="col-span-full text-center text-gray-500 mt-4">
          {t("productsPage.loading")}
        </p>
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

      {farmProducts.length === 0 ? (
        <p className="text-gray-500">{t("productsPage.noProducts")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        className="pt-6"
      />
    </div>
  );
}
