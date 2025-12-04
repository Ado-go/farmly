import { ImageCarousel } from "@/components/ImageCarousel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCategoryLabel } from "@/lib/productCategories";
import type { FarmProduct, Product } from "@/types/farm";
import type { TFunction } from "i18next";
import type { LucideIcon } from "lucide-react";
import { Star, Store } from "lucide-react";

type ProductMediaSectionProps = {
  product: Product;
  farmProduct: FarmProduct;
  images: { url: string }[];
  avgRating: string | null;
  totalReviewsCount: number;
  CategoryIcon: LucideIcon;
  quantity: number;
  onQuantityChange: (value: number) => void;
  onAddToCart: () => void;
  t: TFunction;
};

export function ProductMediaSection({
  product,
  farmProduct,
  images,
  avgRating,
  totalReviewsCount,
  CategoryIcon,
  quantity,
  onQuantityChange,
  onAddToCart,
  t,
}: ProductMediaSectionProps) {
  const handleQuantityInput = (value: number) => {
    if (Number.isNaN(value)) return;
    const maxQty =
      farmProduct.stock && farmProduct.stock > 0
        ? farmProduct.stock
        : Number.MAX_SAFE_INTEGER;
    const normalized = Math.max(1, Math.min(Math.floor(value), maxQty));
    onQuantityChange(normalized);
  };

  return (
    <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-primary/10 shadow-sm">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <div className="relative w-full overflow-hidden rounded-xl border border-gray-100 bg-white/90 shadow-sm">
            {images.length > 0 ? (
              <ImageCarousel
                images={images}
                editable={false}
                height="h-72"
                emptyLabel={t("productCard.noImage")}
              />
            ) : (
              <div className="flex h-72 w-full items-center justify-center bg-primary/5 text-primary">
                {t("productCard.noImage")}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-gray-100 bg-white/90 p-4 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
                <Star className="h-4 w-4 fill-primary" />
                <span className="font-semibold">
                  {avgRating ?? t("productCard.noRating")}
                </span>
                {totalReviewsCount > 0 ? (
                  <span className="text-xs text-gray-500">
                    ({totalReviewsCount})
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-gray-700 shadow-sm border border-gray-100">
                <CategoryIcon className="h-4 w-4 text-primary" />
                <span>{getCategoryLabel(product.category || "", t)}</span>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-700">
                <Store className="h-4 w-4 text-primary" />
                <span>{farmProduct.farm?.name}</span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-white px-4 py-3">
                <p className="text-xs text-gray-500">
                  {t("productCard.price")}
                </p>
                <p className="text-lg font-semibold text-primary">
                  {farmProduct.price} €
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-white px-4 py-3">
                <p className="text-xs text-gray-500">
                  {t("productCard.stock")}
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {farmProduct.stock ?? "—"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="text-sm font-medium text-gray-700">
                {t("cartPage.quantity")}
              </label>
              <div className="flex items-center gap-3 flex-wrap">
                <Input
                  type="number"
                  min={1}
                  max={farmProduct.stock ?? undefined}
                  value={quantity}
                  className="w-28"
                  onChange={(e) => handleQuantityInput(e.target.valueAsNumber)}
                />
                <Button onClick={onAddToCart}>
                  {t("productCard.addToCart")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-primary/10 bg-white/90 p-4 shadow-sm space-y-3">
          <p className="text-sm text-gray-700">
            {product.description || t("productCard.noDescription")}
          </p>
        </div>
      </div>
    </Card>
  );
}
