import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import type { FarmProduct } from "@/types/farm";
import { getCategoryLabel } from "@/lib/productCategories";

type ProductCardProps = {
  product: FarmProduct;
  sellerNameOverride?: string;
};

export function ProductCard({ product, sellerNameOverride }: ProductCardProps) {
  const { t } = useTranslation();
  const { addToCart } = useCart();

  const { product: inner } = product;
  const isUnavailable = product.isAvailable === false;
  const isSoldOut = (product.stock ?? 0) <= 0;
  const isDisabled = isUnavailable || isSoldOut;
  const ratingValue =
    inner.rating !== undefined && inner.rating !== null
      ? Number(inner.rating)
      : null;
  const rating =
    ratingValue !== null && Number.isFinite(ratingValue) && ratingValue > 0
      ? ratingValue.toFixed(1)
      : null;
  const reviewsCount = inner.reviews?.length ?? 0;
  const displaySellerName = sellerNameOverride ?? product.farm?.name;

  const handleAddToCart = (fp: FarmProduct) => {
    if (fp.isAvailable === false) {
      toast.error(t("product.unavailableForSale"));
      return;
    }
    if (isSoldOut) {
      toast.error(t("product.outOfStock"));
      return;
    }

    const added = addToCart(
      {
        productId: fp.product.id,
        productName: fp.product.name,
        sellerName: sellerNameOverride ?? fp.farm?.name ?? "unknown",
        unitPrice: fp.price,
        quantity: 1,
        stock: fp.stock,
      },
      "STANDARD"
    );

    if (added) {
      toast.success(t("productCard.addedToCart", { name: fp.product.name }));
    }
  };

  return (
    <Card className="group h-full overflow-hidden border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/40 to-white transition hover:-translate-y-1 hover:shadow-lg dark:border-primary/30 dark:from-primary/18 dark:via-emerald-900/40 dark:to-background">
      <Link
        to="/products/$id"
        params={{ id: String(inner.id) }}
        className="block cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="relative h-44 w-full overflow-hidden">
          {inner.images?.[0]?.url ? (
            <img
              src={inner.images[0].url}
              alt={inner.name}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-sm text-gray-500">
              {t("productCard.noImage")}
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur dark:bg-emerald-900/70 dark:text-emerald-50">
              {getCategoryLabel(inner.category, t)}
            </span>
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-white shadow">
            {product.price} €
          </span>
          {isSoldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white shadow">
                {t("product.soldOut")}
              </span>
            </div>
          )}
        </div>

        <CardContent className="space-y-3 p-5">
          <h3 className="text-lg font-semibold leading-tight line-clamp-2">
            {inner.name}
          </h3>

          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-amber-400" />
              <span className="font-medium">
                {rating ?? t("productCard.noRating")}
              </span>
              {reviewsCount > 0 ? (
                <span className="text-xs text-gray-500">
                  ({reviewsCount})
                </span>
              ) : null}
            </div>
            {product.stock !== undefined ? (
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  isSoldOut
                    ? "bg-red-50 text-red-700 dark:bg-rose-900/50 dark:text-rose-50"
                    : "bg-gray-100 text-gray-600 dark:bg-emerald-900/50 dark:text-emerald-50"
                }`}
              >
                {t("productCard.stock")}: {product.stock}
              </span>
            ) : null}
          </div>

          {displaySellerName && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Store className="h-4 w-4 text-primary" />
              <span>
                {t("productCard.farmName")}: {displaySellerName}
              </span>
            </div>
          )}
        </CardContent>
      </Link>

      <div className="p-4 pt-0">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => handleAddToCart(product)}
          disabled={isDisabled}
        >
          {isSoldOut
            ? t("product.soldOut")
            : isUnavailable
            ? t("product.unavailable")
            : t("productCard.addToCart")}
        </Button>
      </div>
    </Card>
  );
}
