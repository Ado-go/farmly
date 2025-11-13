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
  } = useQuery({
    queryKey: ["farmProduct", id],
    queryFn: async () => apiFetch(`/public-farm-products/${id}`),
  });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const addReview = useMutation({
    mutationFn: async () =>
      apiFetch(`/review`, {
        method: "POST",
        body: JSON.stringify({
          productId: farmProduct.product.id,
          rating,
          comment,
        }),
      }),
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
  const avgRating = averageRating(product.reviews);
  const userReview = user
    ? product.reviews?.find((r) => r.user?.id === user.id)
    : null;
  const otherReviews =
    product.reviews?.filter((r) => r.user?.id !== user?.id) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {product.images?.[0]?.url ? (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-32 object-cover mt-2 rounded"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 rounded">
              {t("productCard.noImage")}
            </div>
          )}

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

            <p className="text-sm text-gray-600">
              {product.description || t("productCard.noDescription")}
            </p>
          </div>
          <div>
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
                    {new Date(userReview.createdAt).toLocaleDateString()}
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
                onClick={() => deleteReview.mutate(userReview.id)}
                disabled={deleteReview.isPending}
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
            {otherReviews.map((r) => (
              <div key={r.id} className="border-b pb-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
                  <span className="font-medium">{r.rating}/5</span>
                  <span className="text-sm text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {r.comment && <p className="text-sm mt-1">{r.comment}</p>}
                <p className="text-xs text-gray-500">{r.user?.name}</p>
              </div>
            ))}
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
              <Input
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                required
              />
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

            <Button type="submit" disabled={addReview.isPending}>
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

function averageRating(reviews: { rating: number }[] = []) {
  if (reviews.length === 0) return null;
  const avg =
    reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  return avg.toFixed(1);
}
