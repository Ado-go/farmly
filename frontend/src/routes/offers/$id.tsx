import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { getCategoryLabel } from "@/lib/productCategories";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Package, Sparkles, Tag, User } from "lucide-react";

export const Route = createFileRoute("/offers/$id")({
  component: OfferDetailPage,
});

type Offer = {
  id: number;
  title: string;
  description?: string;
  category: string;
  price: number;
  user: { id: number; name: string };
  product: {
    id: number;
    name: string;
    category: string;
    description?: string;
    basePrice?: number;
    images?: { url: string; optimizedUrl?: string; publicId?: string }[];
  };
};

function OfferDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const {
    data: offer,
    isLoading,
    isError,
  } = useQuery<Offer>({
    queryKey: ["offerDetail", id],
    queryFn: async () => apiFetch(`/offer/${id}`),
  });

  useEffect(() => {
    if (offer?.title) {
      document.title = `${offer.title} | ${t("offers")}`;
    }
  }, [offer?.title, t]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <Card className="space-y-3 border-primary/20 bg-white/80 p-6 shadow-sm animate-pulse">
            <div className="h-5 w-24 rounded bg-gray-200" />
            <div className="h-8 w-2/3 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
          </Card>
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="h-72 bg-gray-100 animate-pulse" />
            <Card className="space-y-3 bg-gray-50 p-5 animate-pulse">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-4 w-40 rounded bg-gray-200" />
              <div className="h-20 rounded bg-gray-200" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !offer) {
    return (
      <p className="p-6 text-center text-red-500">
        {isError ? t("offersPage.errorLoading") : t("offersPage.notFound")}
      </p>
    );
  }

  const offerCategoryLabel = getCategoryLabel(offer.category, t);
  const productCategoryLabel = getCategoryLabel(offer.product.category, t);
  const carouselImages =
    offer.product?.images?.map((img) => ({
      url: img.optimizedUrl || img.url,
    })) ?? [];
  const offerDescription =
    offer.description && offer.description.trim()
      ? offer.description
      : t("offersPage.noDescription");
  const productDescription =
    offer.product?.description && offer.product.description.trim()
      ? offer.product.description
      : t("offersPage.noDescription");

  return (
    <div className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-white to-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">
                <Tag className="h-4 w-4" />
                {offerCategoryLabel}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                {offer.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                <span className="rounded-full bg-primary/10 px-3 py-1 font-semibold text-primary">
                  {productCategoryLabel}
                </span>
                {offer.product?.name ? (
                  <span className="rounded-full bg-white px-3 py-1 shadow-sm">
                    {offer.product.name}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="rounded-xl border border-primary/20 bg-white px-4 py-3 text-right shadow-sm">
                <p className="text-xs text-gray-500">
                  {t("offersPage.priceLabel")}
                </p>
                <p className="text-3xl font-bold text-primary">
                  {offer.price.toFixed(2)} €
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                <User className="h-4 w-4 text-primary" />
                <span>
                  {t("offersPage.seller")}: {offer.user?.name ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden border-primary/15 shadow-sm">
            <ImageCarousel
              images={carouselImages}
              height="h-80"
              emptyLabel={t("offersPage.noImage")}
            />
          </Card>

          <Card className="space-y-5 border-primary/15 bg-white/90 p-5 shadow-sm">
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("offersPage.offerDetails")}
              </h3>
              <p className="text-sm leading-relaxed text-gray-700">
                {offerDescription}
              </p>
              <div className="rounded-lg border border-gray-100 bg-primary/5 px-4 py-3 text-sm text-gray-700">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <div>
                      <p className="font-semibold">
                        {offer.user?.name ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("offersPage.seller")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {t("offersPage.categoryLabel")}
                    </p>
                    <p className="font-semibold text-primary">
                      {offerCategoryLabel}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Package className="h-5 w-5 text-primary" />
                {t("offersPage.productDetails")}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-gray-100 bg-white px-3 py-3 shadow-sm">
                  <p className="text-xs text-gray-500">
                    {t("offersPage.productName")}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {offer.product?.name ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white px-3 py-3 shadow-sm">
                  <p className="text-xs text-gray-500">
                    {t("offersPage.productCategory")}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {productCategoryLabel}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white px-3 py-3 shadow-sm">
                  <p className="text-xs text-gray-500">
                    {t("offersPage.productBasePrice")}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {typeof offer.product?.basePrice === "number"
                      ? `${offer.product.basePrice.toFixed(2)} €`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white px-3 py-3 shadow-sm">
                  <p className="text-xs text-gray-500">
                    {t("offersPage.priceLabel")}
                  </p>
                  <p className="font-semibold text-gray-800">
                    {offer.price.toFixed(2)} €
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">
                {productDescription}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
