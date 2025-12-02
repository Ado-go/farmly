import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { PaginationControls } from "@/components/PaginationControls";
import { apiFetch } from "@/lib/api";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { getCategoryLabel } from "@/lib/productCategories";
import type { PaginatedResponse } from "@/types/pagination";
import { ProfileAvatar } from "@/components/ProfileAvatar";

export const Route = createFileRoute("/farms/")({
  component: FarmsPage,
  validateSearch: (search: Record<string, unknown>) => ({
    page: Math.max(1, Number(search.page) || 1),
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
  useEffect(() => {
    document.title = `${t("farms")} | ${t("farmly")}`;
  }, [t]);

  const { page } = Route.useSearch();
  const navigate = useNavigate();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const {
    data,
    isLoading,
    isError,
  } = useQuery<PaginatedResponse<Farm>>({
    queryKey: ["farms", page],
    queryFn: async () => apiFetch(`/farms?page=${page}&limit=${DEFAULT_PAGE_SIZE}`),
    placeholderData: keepPreviousData,
  });

  const farms = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handlePageChange = (nextPage: number) => {
    const safePage = Math.max(1, Math.min(nextPage, totalPages || nextPage));
    navigate({ to: "/farms", search: { page: safePage } });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse h-40" />
        ))}
        <p className="col-span-full text-center text-gray-500 mt-4">
          {t("farmsPage.loading")}
        </p>
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

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-2xl font-bold mb-6">{t("farmsPage.title")}</h2>

      {farmers?.length === 0 ? (
        <p className="text-gray-500">{t("farmsPage.noFarms")}</p>
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
