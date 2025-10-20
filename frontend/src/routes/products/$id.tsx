import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const {
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => apiFetch(`/products/${id}`),
  });

  if (isLoading) {
    return (
      <p className="text-center text-gray-500 mt-10">
        {t("productsPage.loading")}
      </p>
    );
  }

  if (isError || !product) {
    return (
      <p className="text-center text-red-500 mt-10">
        {t("productsPage.error")}
      </p>
    );
  }

  const imageUrl = product.images?.[0]?.url || "/placeholder.jpg";
  const rating = averageRating(product.reviews);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-64 object-cover rounded-lg"
          />

          <div>
            <h1 className="text-2xl font-bold mb-3">{product.name}</h1>
            <p className="text-gray-700 mb-2">
              {t("productCard.price")}: {product.price} €
            </p>

            <div className="flex items-center text-yellow-500 mb-3">
              <Star className="w-4 h-4 fill-yellow-400" />
              <span className="ml-1 text-sm text-gray-700">
                {rating ?? t("productCard.noRating")}
              </span>
            </div>

            <p className="text-gray-500 mb-3">
              {t("productCard.farmName")}: {product.farm?.name}
            </p>

            <p className="text-sm text-gray-600">{product.description}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function averageRating(reviews: { rating: number }[] = []) {
  if (reviews.length === 0) return null;
  const avg =
    reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  return avg.toFixed(1);
}
