import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { getCategoryLabel } from "@/lib/productCategories";

export const Route = createFileRoute("/offers/")({
  component: OffersAllPage,
});

type Offer = {
  id: number;
  title: string;
  description?: string;
  category: string;
  price: number;
  user: {
    id: number;
    name: string;
  };
  product: {
    id: number;
    name: string;
    category: string;
    basePrice?: number;
    description?: string;
    images?: { url: string; publicId: string }[];
  };
};

function OffersAllPage() {
  const { t } = useTranslation();

  const {
    data: offers = [],
    isLoading,
    isError,
  } = useQuery<Offer[]>({
    queryKey: ["offersAll"],
    queryFn: async () => apiFetch("/offer/all"),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse h-40" />
        ))}
        <p className="col-span-full text-center text-gray-500 mt-4">
          {t("offersPage.loading")}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-red-500 p-6">
        {t("offersPage.errorLoading")}
      </p>
    );
  }

  if (offers.length === 0) {
    return (
      <p className="text-gray-500 text-center p-6">
        {t("offersPage.noOffers")}
      </p>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold mb-4">{t("offersPage.title")}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {offers.map((offer) => (
          <Link key={offer.id} to="/offers/$id" params={{ id: String(offer.id) }}>
            <Card className="p-4 hover:shadow-lg transition">
              <h3 className="font-semibold">{offer.title}</h3>
              {offer.product?.images?.[0]?.url ? (
                <img
                  src={offer.product.images[0].url}
                  alt={offer.title}
                  className="w-full h-32 object-cover mt-2 rounded"
                />
              ) : (
                <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-500 mt-2 rounded">
                  {t("offersPage.noImage")}
                </div>
              )}
              <p className="text-sm mt-2 text-gray-600">
                {getCategoryLabel(offer.category, t)} • {offer.price} €
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t("offersPage.by")} {offer.user.name}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
