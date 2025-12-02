import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Star, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { ImageCarousel } from "@/components/ImageCarousel";
import type { FarmProduct } from "@/types/farm";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const {
    data: farmProduct,
    isLoading,
    isError,
  } = useQuery<FarmProduct>({
    queryKey: ["farmProduct", id],
    queryFn: async () => apiFetch(`/public-farm-products/${id}`),
  });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [quantity, setQuantity] = useState(1);

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
  const hasReviews = (product.reviews?.length ?? 0) > 0;
  const avgRating =
    hasReviews && typeof product.rating === "number"
      ? product.rating.toFixed(1)
      : null;
  const userReview = user
    ? product.reviews?.find((r) => r.user?.id === user.id)
    : null;
  const otherReviews =
    product.reviews?.filter((r) => r.user?.id !== user?.id) || [];

  const productImages =
    product.images?.map((img) => ({
      url: img.optimizedUrl || img.url,
    })) ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col justify-center">
            {productImages.length > 0 ? (
              <ImageCarousel
                images={productImages}
                editable={false}
                height="h-56"
                emptyLabel={t("productCard.noImage")}
              />
            ) : (
              <div className="w-full h-56 bg-gray-200 flex items-center justify-center text-gray-500 rounded">
                {t("productCard.noImage")}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-3">{product.name}</h1>
            <p className="text-gray-700 mb-2">
              {t("productCard.price")}: {farmProduct.price} €
            </p>
            <p className="text-gray-700 mb-2">
              {t("productCard.stock")}: {farmProduct.stock}
            </p>

            <div className="flex items-center text-yellow-500 mb-3">
              <Star className="w-4 h-4 fill-yellow-400" />
              <span className="ml-1 text-sm text-gray-700">
                {avgRating ?? t("productCard.noRating")}
              </span>
            </div>

            <p className="text-gray-500 mb-3">
              {t("productCard.farmName")}: {farmProduct.farm?.name}
            </p>

            <p className="text-sm text-gray-600 mb-4">
              {product.description || t("productCard.noDescription")}
            </p>

            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium text-gray-700">
                {t("cartPage.quantity")}
              </label>
              <Input
                type="number"
                min={1}
                max={farmProduct.stock ?? undefined}
                value={quantity}
                className="w-24"
                onChange={(e) => {
                  const value = e.target.valueAsNumber;
                  if (Number.isNaN(value)) return;
                  const maxQty =
                    farmProduct.stock && farmProduct.stock > 0
                      ? farmProduct.stock
                      : Number.MAX_SAFE_INTEGER;
                  setQuantity(Math.max(1, Math.min(Math.floor(value), maxQty)));
                }}
              />
            </div>

            <Button onClick={() => handleAddToCart(farmProduct)}>
              {t("productCard.addToCart")}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{t("reviews.title")}</h2>

        {userReview && (
          <div className="border-b pb-3 mb-4 bg-gray-50 p-3 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
                  <span className="font-medium">{userReview.rating}/5</span>
                  <span className="text-sm text-gray-400">
                    {userReview.createdAt
                      ? new Date(userReview.createdAt).toLocaleDateString()
                      : ""}
                  </span>
                </div>
                {userReview.comment && (
                  <p className="text-sm mt-1">{userReview.comment}</p>
                )}
                <p className="text-xs text-gray-500">{userReview.user?.name}</p>
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

        {otherReviews.length === 0 && !userReview ? (
          <p className="text-gray-500 mb-4">{t("reviews.none")}</p>
        ) : (
          <div className="space-y-4 mb-6">
            {otherReviews.map((r) => {
              const reviewDate = r.createdAt
                ? new Date(r.createdAt).toLocaleDateString()
                : "";
              return (
                <div key={r.id} className="border-b pb-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
                    <span className="font-medium">{r.rating}/5</span>
                    <span className="text-sm text-gray-400">{reviewDate}</span>
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
  );
}

