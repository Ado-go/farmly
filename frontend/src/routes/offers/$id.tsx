import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/offers/$id")({
  component: OfferDetailPage,
});

type Offer = {
  id: number;
  title: string;
  description?: string;
  category: string;
  price: number;
  imageUrl?: string;
  user: { id: number; name: string };
  product: { id: number; name: string; category: string; description?: string };
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
    queryFn: async () =>
      apiFetch(`/offer/all`).then((offers) =>
        offers.find((o: Offer) => o.id === Number(id))
      ),
  });

  if (isLoading) {
    return <p className="p-6 text-gray-500">{t("offersPage.loading")}</p>;
  }

  if (isError || !offer) {
    return (
      <p className="text-center text-red-500 p-6">{t("offersPage.notFound")}</p>
    );
  }

  return (
    <div className="p-6 flex justify-center">
      <Card className="p-6 max-w-2xl w-full">
        {offer.imageUrl && (
          <img
            src={offer.imageUrl}
            alt={offer.title}
            className="w-full h-64 object-cover rounded mb-4"
          />
        )}
        <h2 className="text-2xl font-bold mb-2">{offer.title}</h2>
        <p className="text-gray-600 mb-2">{offer.description}</p>
        <p className="text-sm text-gray-500">
          {offer.category} • {offer.price} €
        </p>
        <p className="text-sm text-gray-400 mt-2">
          {t("offersPage.seller")}: {offer.user?.name}
        </p>
        {offer.product && (
          <div className="mt-4">
            <h3 className="font-semibold">{t("offersPage.productInfo")}</h3>
            <p>{offer.product.name}</p>
            <p className="text-sm text-gray-500">
              {offer.product.category} — {offer.product.description}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
