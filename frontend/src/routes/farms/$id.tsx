import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ProductCard } from "@/components/ProductCard";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/farms/$id")({
  component: FarmDetailPage,
});

function FarmDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();

  const {
    data: farm,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["farm", id],
    queryFn: async () => apiFetch(`/farms/${id}`),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
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
      <p className="text-center text-red-500 p-6">{t("farmsPage.error")}</p>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">{farm.name}</h2>
      <p className="mb-2">{farm.description}</p>
      <p className="mb-2">
        {farm.city}, {farm.street}, {farm.region}, {farm.postalCode},{" "}
        {farm.country}
      </p>
      <p className="mb-4 font-semibold">
        {t("farmsPage.farmer")}: {farm.farmer.name}
      </p>

      <h3 className="text-xl font-semibold mb-4">{t("farmsPage.products")}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {farm.products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={(id) => console.log("Add to cart:", id)}
          />
        ))}
      </div>
    </div>
  );
}
