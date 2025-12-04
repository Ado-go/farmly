import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import {
  Star,
  Trash2,
  Store,
  Apple,
  Carrot,
  Drumstick,
  Milk,
  Croissant,
  CupSoda,
  Package,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { ImageCarousel } from "@/components/ImageCarousel";
import type { FarmProduct } from "@/types/farm";
import { getCategoryLabel } from "@/lib/productCategories";
import { PaginationControls } from "@/components/PaginationControls";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const REVIEWS_PAGE_SIZE = 4;

  const CATEGORY_ICONS: Record<string, typeof Apple> = {
    Fruits: Apple,
    Vegetables: Carrot,
    Meat: Drumstick,
    Dairy: Milk,
    Bakery: Croissant,
    Drinks: CupSoda,
    Other: Package,
  };

  const {
    data: farmProduct,
    isLoading,
    isError,
  } = useQuery<FarmProduct>({
    queryKey: ["farmProduct", id],
    queryFn: async () => apiFetch(`/public-farm-products/${id}`),
  });

  useEffect(() => {
    if (!farmProduct?.product?.reviews) return;

    const otherReviews =
      farmProduct.product.reviews.filter((r) => r.user?.id !== user?.id) || [];
    const totalPages = Math.max(
      1,
      Math.ceil(otherReviews.length / REVIEWS_PAGE_SIZE)
    );

    if (reviewsPage > totalPages) {
      setReviewsPage(1);
    }
  }, [farmProduct?.product?.reviews, user?.id, reviewsPage]);

  const addReview = useMutation({
    mutationFn: async () => {
      if (!farmProduct) throw new Error("Product not loaded");
      return apiFetch(`/review`, {
        method: "POST",
        body: JSON.stringify({
          productId: farmProduct.product.id,
          rating,
          comment,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmProduct", id] });
      setRating(0);
      setComment("");
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (reviewId: number) =>
      apiFetch(`/review/${reviewId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmProduct", id] });
    },
  });

  const handleAddToCart = (fp: FarmProduct) => {
    const normalizedQuantity = Math.max(1, Math.floor(quantity));
    const finalQuantity =
      fp.stock && fp.stock > 0
        ? Math.min(normalizedQuantity, fp.stock)
        : normalizedQuantity;

    const added = addToCart(
      {
        productId: fp.product.id,
        productName: fp.product.name,
        sellerName: fp.farm?.name || "unknown",
        unitPrice: fp.price,
        quantity: finalQuantity,
      },
      "STANDARD"
    );

    if (added) {
      toast.success(t("productCard.addedToCart", { name: fp.product.name }));
    }
  };

  if (isLoading)
    return (
      <p className="text-center text-gray-500 mt-10">
        {t("productsPage.loading")}
      </p>
    );

  if (isError || !farmProduct)
    return (
      <p className="text-center text-red-500 mt-10">
        {t("productsPage.error")}
      </p>
    );

  const product = farmProduct.product;
  const ratingValue =
    product.rating !== undefined && product.rating !== null
      ? Number(product.rating)
      : null;
  const avgRating =
    ratingValue !== null && Number.isFinite(ratingValue) && ratingValue > 0
      ? ratingValue.toFixed(1)
      : null;
  const userReview = user
    ? product.reviews?.find((r) => r.user?.id === user.id)
    : null;
  const otherReviews =
    product.reviews?.filter((r) => r.user?.id !== user?.id) || [];
  const totalReviewsCount = product.reviews?.length ?? 0;
  const CategoryIcon =
    CATEGORY_ICONS[(product.category as string) || ""] || Apple;

  const totalReviewPages = Math.max(
    1,
    Math.ceil(otherReviews.length / REVIEWS_PAGE_SIZE)
  );
  const paginatedReviews = otherReviews.slice(
    (reviewsPage - 1) * REVIEWS_PAGE_SIZE,
    reviewsPage * REVIEWS_PAGE_SIZE
  );

  const productImages =
    product.images?.map((img) => ({
      url: img.optimizedUrl || img.url,
    })) ?? [];

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-white to-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">
                <Store className="h-4 w-4" />
                {t("productsPage.heading")}
              </div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Store className="h-4 w-4 text-primary" />
                <span>{farmProduct.farm?.name}</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <div className="relative w-full overflow-hidden rounded-xl border border-gray-100 bg-white">
                {productImages.length > 0 ? (
                  <ImageCarousel
                    images={productImages}
                    editable={false}
                    height="h-72"
                    emptyLabel={t("productCard.noImage")}
                  />
                ) : (
                  <div className="flex h-72 w-full items-center justify-center bg-gray-100 text-gray-500">
                    {t("productCard.noImage")}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-gray-100 bg-white/80 p-4 shadow-sm space-y-4">
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
                  <div className="flex items-center gap-3">
                    <Input
                      type="number"
                      min={1}
                      max={farmProduct.stock ?? undefined}
                      value={quantity}
                      className="w-28"
                      onChange={(e) => {
                        const value = e.target.valueAsNumber;
                        if (Number.isNaN(value)) return;
                        const maxQty =
                          farmProduct.stock && farmProduct.stock > 0
                            ? farmProduct.stock
                            : Number.MAX_SAFE_INTEGER;
                        setQuantity(
                          Math.max(1, Math.min(Math.floor(value), maxQty))
                        );
                      }}
                    />
                    <Button onClick={() => handleAddToCart(farmProduct)}>
                      {t("productCard.addToCart")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-100 bg-white/80 p-4 shadow-sm space-y-3">
              <p className="text-sm text-gray-700">
                {product.description || t("productCard.noDescription")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">{t("reviews.title")}</h2>
              <p className="text-sm text-gray-500">
                {totalReviewsCount} {t("reviews.title").toLowerCase()}
              </p>
            </div>
            {totalReviewPages > 1 && (
              <PaginationControls
                page={reviewsPage}
                totalPages={totalReviewPages}
                onPageChange={setReviewsPage}
                prevLabel={t("pagination.previous")}
                nextLabel={t("pagination.next")}
              />
            )}
          </div>

          {userReview && (
            <div className="border border-primary/20 bg-primary/5 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-semibold">{userReview.rating}/5</span>
                    <span className="text-sm text-gray-400">
                      {userReview.createdAt
                        ? new Date(userReview.createdAt).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  {userReview.comment && (
                    <p className="text-sm">{userReview.comment}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {userReview.user?.name}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (!userReview.id) return;
                    deleteReview.mutate(userReview.id);
                  }}
                  disabled={deleteReview.isPending || !userReview.id}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  {t("reviews.delete")}
                </Button>
              </div>
            </div>
          )}

          {paginatedReviews.length === 0 && !userReview ? (
            <p className="text-gray-500 mb-4">{t("reviews.none")}</p>
          ) : (
            <div className="space-y-4 mb-6">
              {paginatedReviews.map((r) => {
                const reviewDate = r.createdAt
                  ? new Date(r.createdAt).toLocaleDateString()
                  : "";
                return (
                  <div
                    key={r.id}
                    className="rounded-lg border border-gray-100 p-3 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
                      <span className="font-medium">{r.rating}/5</span>
                      <span className="text-sm text-gray-400">
                        {reviewDate}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm mt-1">{r.comment}</p>}
                    <p className="text-xs text-gray-500">{r.user?.name}</p>
                  </div>
                );
              })}
            </div>
          )}

          {user && !userReview && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addReview.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("reviews.rating")}
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="p-1"
                      aria-label={t("reviews.starValue", { value })}
                    >
                      <Star
                        className={`w-6 h-6 ${
                          value <= rating
                            ? "fill-yellow-400 text-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm text-gray-500">
                    {rating ? `${rating}/5` : t("reviews.selectRating")}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t("reviews.comment")}
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={t("reviews.placeholder")}
                />
              </div>

              <Button
                type="submit"
                disabled={addReview.isPending || rating === 0}
              >
                {addReview.isPending
                  ? t("reviews.submitting")
                  : t("reviews.submit")}
              </Button>
            </form>
          )}

          {!user && (
            <p className="text-gray-500 italic">{t("reviews.loginToAdd")}</p>
          )}
        </Card>
      </div>
    </div>
  );
}
