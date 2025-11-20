import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { getCategoryLabel } from "@/lib/productCategories";

import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

export const Route = createFileRoute("/events/$id")({
  component: EventPageDetail,
});

type EventDetail = {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  city: string;
  street: string;
  region: string;
  organizer: { id: number; name: string };
  eventProducts?: {
    id: number;
    product: {
      id: number;
      name: string;
      category: string;
      description: string;
      basePrice: number;
      images?: { url: string }[];
    };
    user: { id: number; name: string };
  }[];
};

function EventPageDetail() {
  const { id } = Route.useParams();
  const { t } = useTranslation();

  const { addToCart } = useCart();

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery<EventDetail>({
    queryKey: ["event", id],
    queryFn: async () => apiFetch(`/public-events/${id}`),
  });

  if (isLoading)
    return (
      <p className="text-center text-gray-500">{t("eventsDetail.loading")}</p>
    );

  if (isError || !event)
    return (
      <p className="text-center text-red-500">
        {t("eventsDetail.errorLoading")}
      </p>
    );

  const products = event.eventProducts ?? [];
  const now = new Date();
  const eventHasNotStarted = new Date(event.startDate) > now;

  type EventProductDetail = NonNullable<EventDetail["eventProducts"]>[number];
  const handleAddToPreorder = (ep: EventProductDetail) => {
    const added = addToCart(
      {
        productId: ep.product.id,
        productName: ep.product.name,
        sellerName: ep.user.name,
        unitPrice: ep.product.basePrice,
        quantity: 1,
      },
      "PREORDER",
      event.id
    );

    if (added) {
      toast.success(t("eventsDetail.addedToCart"));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-2">{event.title}</h2>
        <p className="text-sm text-gray-600">
          {event.city}, {event.region}
        </p>
        <p className="text-xs text-gray-500">
          {new Date(event.startDate).toLocaleDateString()} -{" "}
          {new Date(event.endDate).toLocaleDateString()}
        </p>
        {event.description && (
          <p className="mt-4 text-gray-700">{event.description}</p>
        )}
        <p className="mt-2 text-sm text-gray-600">
          {t("eventsDetail.organizedBy")} {event.organizer.name}
        </p>
      </Card>

      <section>
        <h3 className="text-xl font-semibold mb-4">
          {t("eventsDetail.availableProducts")}
        </h3>

        {products.length === 0 ? (
          <p className="text-gray-500">{t("eventsDetail.noProducts")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((ep) => (
              <Card
                key={ep.id}
                className="p-4 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <h4 className="font-semibold">{ep.product.name}</h4>

                  {ep.product.images?.[0]?.url ? (
                    <img
                      src={ep.product.images[0].url}
                      alt={ep.product.name}
                      className="w-full h-32 object-cover mt-2 rounded"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center text-gray-500 mt-2 rounded">
                      {t("eventsDetail.noImage")}
                    </div>
                  )}

                  <p className="text-sm mt-2 text-gray-600">
                    {getCategoryLabel(ep.product.category, t)} – €
                    {ep.product.basePrice?.toFixed(2) ?? "N/A"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t("eventsDetail.soldBy")} {ep.user.name}
                  </p>
                </div>

                {eventHasNotStarted ? (
                  <Button
                    className="mt-4 w-full"
                    onClick={() => handleAddToPreorder(ep)}
                  >
                    {t("eventsDetail.preorder")}
                  </Button>
                ) : (
                  <p className="mt-4 text-center text-red-500 text-xs">
                    {t("eventsDetail.eventStarted")}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
