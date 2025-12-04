import { PaginationControls } from "@/components/PaginationControls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ProductReview } from "@/types/farm";
import type { TFunction } from "i18next";
import { Star, Trash2 } from "lucide-react";

type ProductReviewsSectionProps = {
  t: TFunction;
  totalReviewsCount: number;
  totalReviewPages: number;
  reviewsPage: number;
  onPageChange: (page: number) => void;
  userReview: ProductReview | null;
  paginatedReviews: ProductReview[];
  rating: number;
  onRatingChange: (rating: number) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onSubmitReview: () => void;
  isSubmitting: boolean;
  onDeleteReview: (id: number) => void;
  isDeleting: boolean;
  user?: { id?: number } | null;
};

export function ProductReviewsSection({
  t,
  totalReviewsCount,
  totalReviewPages,
  reviewsPage,
  onPageChange,
  userReview,
  paginatedReviews,
  rating,
  onRatingChange,
  comment,
  onCommentChange,
  onSubmitReview,
  isSubmitting,
  onDeleteReview,
  isDeleting,
  user,
}: ProductReviewsSectionProps) {
  return (
    <Card className="p-6 border-primary/20 bg-gradient-to-br from-primary/5 via-white to-amber-50 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">{t("reviews.title")}</h2>
          <p className="text-sm text-gray-600">
            {totalReviewsCount} {t("reviews.title").toLowerCase()}
          </p>
        </div>
        {totalReviewPages > 1 && (
          <PaginationControls
            page={reviewsPage}
            totalPages={totalReviewPages}
            onPageChange={onPageChange}
            prevLabel={t("pagination.previous")}
            nextLabel={t("pagination.next")}
          />
        )}
      </div>

      {userReview && (
        <div className="border border-primary/20 bg-white/90 p-4 rounded-lg mb-4 shadow-sm">
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
              <p className="text-xs text-gray-500">{userReview.user?.name}</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (!userReview.id) return;
                onDeleteReview(userReview.id);
              }}
              disabled={isDeleting || !userReview.id}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              {t("reviews.delete")}
            </Button>
          </div>
        </div>
      )}

      {paginatedReviews.length === 0 && !userReview ? (
        <p className="text-gray-600 mb-4 bg-white/70 rounded-lg px-4 py-3 inline-block">
          {t("reviews.none")}
        </p>
      ) : (
        <div className="space-y-4 mb-6">
          {paginatedReviews.map((r) => {
            const reviewDate = r.createdAt
              ? new Date(r.createdAt).toLocaleDateString()
              : "";
            return (
              <div
                key={r.id}
                className="rounded-lg border border-gray-100 bg-white/90 p-3 shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-500" />
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
            onSubmitReview();
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("reviews.rating")}
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onRatingChange(value)}
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
              onChange={(e) => onCommentChange(e.target.value)}
              placeholder={t("reviews.placeholder")}
            />
          </div>

          <Button type="submit" disabled={isSubmitting || rating === 0}>
            {isSubmitting ? t("reviews.submitting") : t("reviews.submit")}
          </Button>
        </form>
      )}

      {!user && (
        <p className="text-gray-600 italic bg-white/70 rounded-lg px-4 py-3 inline-block mt-2">
          {t("reviews.loginToAdd")}
        </p>
      )}
    </Card>
  );
}
