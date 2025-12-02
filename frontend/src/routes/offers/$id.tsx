import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { getCategoryLabel } from "@/lib/productCategories";
import { ImageCarousel } from "@/components/ImageCarousel";

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
    images?: { url: string; publicId: string }[];
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

  if (isLoading) {
    return <p className="p-6 text-gray-500">{t("offersPage.loading")}</p>;
  }

  if (isError || !offer) {
    return (
      <p className="text-center text-red-500 p-6">{t("offersPage.notFound")}</p>
    );
  }

  const offerCategoryLabel = getCategoryLabel(offer.category, t);
  const productCategoryLabel = getCategoryLabel(offer.product.category, t);

  return (
    <div className="p-6 flex justify-center">
      <Card className="p-6 max-w-2xl w-full">
        <div className="mb-4">
          {offer.product?.images?.length ? (
            <ImageCarousel
              images={offer.product.images}
              height="h-64"
              emptyLabel={t("offersPage.noImage")}
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 text-gray-500 rounded flex items-center justify-center">
              {t("offersPage.noImage")}
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold mb-2">{offer.title}</h2>
        <p className="text-gray-600 mb-2">{offer.description}</p>
        <p className="text-sm text-gray-500">
          {offerCategoryLabel} • {offer.price} €
        </p>
        <p className="text-sm text-gray-400 mt-2">
          {t("offersPage.seller")}: {offer.user?.name}
        </p>
        {offer.product && (
          <div className="mt-4">
            <h3 className="font-semibold">{t("offersPage.productInfo")}</h3>
            <p>{offer.product.name}</p>
            <p className="text-sm text-gray-500">
              {productCategoryLabel} — {offer.product.description}
            </p>
            {offer.product.basePrice && (
              <p className="text-sm text-gray-500">
                {t("offersPage.productPriceLabel")}: {offer.product.basePrice} €
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
