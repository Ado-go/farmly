import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

type ProductCardProps = {
  product: {
    id: number;
    price: number;
    stock?: number;
    product: {
      id: number;
      name: string;
      category?: string;
      description?: string;
      rating?: number;
      images?: { url: string }[];
      reviews?: { rating: number }[];
    };
    farm?: { id: number; name: string };
  };
  onAddToCart?: (id: number) => void;
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { t } = useTranslation();

  const { product: inner } = product;
  const imageUrl = inner.images?.[0]?.url || "/placeholder.jpg";
  const rating = inner.rating ?? averageRating(inner.reviews);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link
        to={`/products/${inner.id}`}
        className="block cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={inner.name}
            className="object-cover w-full h-full"
          />
        </div>

        <CardHeader>
          <CardTitle className="text-lg truncate">{inner.name}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <p className="text-sm text-gray-600">
            {t("productCard.price")}: {product.price} €
          </p>

          <div className="flex items-center text-yellow-500">
            <Star className="w-4 h-4 fill-yellow-400" />
            <span className="ml-1 text-sm text-gray-700">
              {rating ?? t("productCard.noRating")}
            </span>
          </div>

          {product.farm?.name && (
            <p className="text-xs text-gray-500">
              {t("productCard.farmName")}: {product.farm.name}
            </p>
          )}

          {product.stock !== undefined && (
            <p className="text-xs text-gray-500">
              {t("productCard.stock")}: {product.stock}
            </p>
          )}
        </CardContent>
      </Link>

      <div className="p-4 pt-0">
        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => onAddToCart?.(product.product.id)}
        >
          {t("productCard.addToCart")}
        </Button>
      </div>
    </Card>
  );
}

function averageRating(reviews: { rating: number }[] = []) {
  if (reviews.length === 0) return null;
  const avg =
    reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  return avg.toFixed(1);
}
