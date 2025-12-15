import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Apple, Carrot, Croissant, CupSoda, Drumstick, Milk, Package } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import type { FarmProduct } from "@/types/farm";
import { ProductHero } from "@/components/products/ProductHero";
import { ProductMediaSection } from "@/components/products/ProductMediaSection";
import { ProductReviewsSection } from "@/components/products/ProductReviewsSection";

export const Route = createFileRoute("/products/$id")({
  component: ProductDetailPage,
});

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
    if (fp.isAvailable === false) {
      toast.error(t("product.unavailableForSale"));
      return;
    }
    if (fp.stock !== undefined && fp.stock !== null && fp.stock <= 0) {
      toast.error(t("product.outOfStock"));
      return;
    }

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
        stock: fp.stock,
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
    ? product.reviews?.find((r) => r.user?.id === user.id) ?? null
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
  const farmName = farmProduct.farm?.name;

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <ProductHero
          heading={t("productsPage.heading")}
          productName={product.name}
          farmName={farmName}
        />

        <ProductMediaSection
          product={product}
          farmProduct={farmProduct}
          images={productImages}
          avgRating={avgRating}
          totalReviewsCount={totalReviewsCount}
          CategoryIcon={CategoryIcon}
          quantity={quantity}
          onQuantityChange={setQuantity}
          onAddToCart={() => handleAddToCart(farmProduct)}
          t={t}
        />

        <ProductReviewsSection
          t={t}
          totalReviewsCount={totalReviewsCount}
          totalReviewPages={totalReviewPages}
          reviewsPage={reviewsPage}
          onPageChange={setReviewsPage}
          userReview={userReview}
          paginatedReviews={paginatedReviews}
          rating={rating}
          onRatingChange={setRating}
          comment={comment}
          onCommentChange={setComment}
          onSubmitReview={() => addReview.mutate()}
          isSubmitting={addReview.isPending}
          onDeleteReview={(reviewId) => deleteReview.mutate(reviewId)}
          isDeleting={deleteReview.isPending}
          user={user}
        />
      </div>
    </div>
  );
}
