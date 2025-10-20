import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";

type ProductCardProps = {
  product: {
    id: number;
    name: string;
    price: number;
    images?: { url: string }[];
    farm?: { name: string };
    reviews?: { rating: number }[];
  };
  onAddToCart?: (id: number) => void;
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { t } = useTranslation();
  const imageUrl = product.images?.[0]?.url || "/placeholder.jpg";
  const rating = averageRating(product.reviews);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link
        to={`/products/${product.id}`}
        className="block cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="object-cover w-full h-full"
          />
        </div>

        <CardHeader>
          <CardTitle className="text-lg truncate">{product.name}</CardTitle>
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

          <p className="text-xs text-gray-500">
            {t("productCard.farmName")}: {product.farm?.name}
          </p>
        </CardContent>
      </Link>

      <div className="p-4 pt-0">
        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => onAddToCart?.(product.id)}
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
