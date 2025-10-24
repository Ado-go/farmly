import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/farms/")({
  component: FarmsPage,
});

type Farm = {
  id: number;
  name: string;
  images: { url: string }[];
  products: any[];
  farmer?: {
    id: number;
    name: string;
  } | null;
};

function FarmsPage() {
  const { t } = useTranslation();

  const {
    data: farms = [],
    isLoading,
    isError,
  } = useQuery<Farm[]>({
    queryKey: ["farms"],
    queryFn: async () => apiFetch("/farms"),
  });

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
  farms.forEach((farm) => {
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

      {farmers.length === 0 ? (
        <p className="text-gray-500">{t("farmsPage.noFarms")}</p>
      ) : (
        farmers.map(({ farmer, farms }) => (
          <div key={farmer.id}>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                👩‍🌾
              </div>
              <span className="font-semibold">{farmer.name}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {farms.map((farm) => (
                <Link key={farm.id} to={`/farms/${farm.id}`}>
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
                      {farm.products?.length || 0} {t("farmsPage.products")}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
