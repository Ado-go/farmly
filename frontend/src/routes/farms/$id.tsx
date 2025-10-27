import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ProductCard } from "@/components/ProductCard";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/farms/$id")({
  component: FarmDetailPage,
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
    rating: number;
    images: { url: string }[];
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
  farmer?: { id: number; name: string };
  farmProducts: FarmProduct[];
};

function FarmDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();

  const {
    data: farm,
    isLoading,
    isError,
  } = useQuery<FarmDetail>({
    queryKey: ["farm", id],
    queryFn: async () => apiFetch(`/farms/${id}`),
  });

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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-2">{farm.name}</h2>
      {farm.description && (
        <p className="mb-3 text-gray-700">{farm.description}</p>
      )}
      <p className="text-sm text-gray-600">
        {farm.street}, {farm.city}, {farm.region}, {farm.postalCode},{" "}
        {farm.country}
      </p>
      <p className="mt-2 font-semibold text-emerald-700">
        {t("farmsPage.farmer")}:{" "}
        {farm.farmer?.name || t("farmsPage.unknownFarmer")}
      </p>

      <h3 className="text-2xl font-semibold mt-8 mb-4">
        {t("farmsPage.products")}
      </h3>

      {farm.farmProducts?.length === 0 ? (
        <p className="text-gray-500">{t("farmsPage.noProducts")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {farm.farmProducts.map((fp) => (
            <ProductCard
              key={fp.id}
              product={{
                id: fp.id,
                price: fp.price,
                stock: fp.stock,
                product: {
                  id: fp.product.id,
                  name: fp.product.name,
                  category: fp.product.category,
                  description: fp.product.description,
                  rating: fp.product.rating,
                  images: fp.product.images,
                },
              }}
              onAddToCart={() => console.log("Add to cart:", fp.product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
