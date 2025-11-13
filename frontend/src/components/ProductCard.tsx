import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

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
};

export function ProductCard({ product }: ProductCardProps) {
  const { t } = useTranslation();
  const { addToCart } = useCart();

  const { product: inner } = product;
  const rating = averageRating(inner.reviews);

  const handleAddToCart = (fp) => {
    addToCart(
      {
        productId: fp.product.id,
        productName: fp.product.name,
        sellerName: fp.farm?.name || "unknown",
        unitPrice: fp.price,
        quantity: 1,
      },
      "STANDARD"
    );

    toast.success(t("productCard.addedToCart", { name: fp.product.name }));
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow p-2">
      <Link
        to={`/products/${inner.id}`}
        className="block cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
      >
        {inner.images?.[0]?.url ? (
          <img
            src={inner.images[0].url}
            alt={inner.name}
            className="w-full h-32 object-cover mt-2 rounded"
          />
        ) : (
          <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-500 rounded">
            {t("productCard.noImage")}
          </div>
        )}

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
          onClick={() => handleAddToCart(product)}
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
