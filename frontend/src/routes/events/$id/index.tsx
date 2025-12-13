import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { getCategoryLabel } from "@/lib/productCategories";
import { ImageCarousel } from "@/components/ImageCarousel";
import { PaginationControls } from "@/components/PaginationControls";
import { CalendarDays, Clock, MapPin, Store } from "lucide-react";

import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import type { EventDetail } from "@/types/events";

export const Route = createFileRoute("/events/$id/")({
  component: EventPageDetail,
});

type EventProductDetail = NonNullable<EventDetail["eventProducts"]>[number];
const PRODUCTS_PER_FARMER_PAGE = 6;

function EventPageDetail() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const [farmerPages, setFarmerPages] = useState<Record<number, number>>({});
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const { addToCart } = useCart();

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery<EventDetail>({
    queryKey: ["event", id],
    queryFn: async () => apiFetch(`/public-events/${id}`),
  });

  const products = useMemo(
    () => event?.eventProducts ?? [],
    [event?.eventProducts]
  );

  const groupedProducts = useMemo(() => {
    const map = new Map<
      number,
      { farmerId: number; farmerName: string; products: EventProductDetail[] }
    >();

    for (const ep of products) {
      const existing = map.get(ep.user.id);
      if (existing) {
        existing.products.push(ep);
      } else {
        map.set(ep.user.id, {
          farmerId: ep.user.id,
          farmerName: ep.user.name,
          products: [ep],
        });
      }
    }

    return Array.from(map.values());
  }, [products]);

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

  const now = new Date();
  const eventHasNotStarted = new Date(event.startDate) > now;
  const carouselImages =
    event.images?.map((img) => ({
      url: img.optimizedUrl || img.url,
    })) ?? [];

  const normalizeQuantity = (value: number, stock?: number) => {
    const maxQty =
      stock && stock > 0 ? stock : Number.MAX_SAFE_INTEGER;
    return Math.max(1, Math.min(Math.floor(value), maxQty));
  };

  const handleQuantityChange = (
    ep: EventProductDetail,
    value: number
  ) => {
    if (Number.isNaN(value)) return;
    const normalized = normalizeQuantity(value, ep.stock);
    setQuantities((prev) => ({ ...prev, [ep.id]: normalized }));
  };

  const handleAddToPreorder = (ep: EventProductDetail) => {
    const unitPrice = ep.price ?? ep.product.basePrice ?? 0;
    const desiredQuantity = quantities[ep.id] ?? 1;
    const quantity = normalizeQuantity(desiredQuantity, ep.stock);
    const added = addToCart(
      {
        productId: ep.product.id,
        productName: ep.product.name,
        sellerName: ep.user.name,
        unitPrice,
        quantity,
        stock: ep.stock,
      },
      "PREORDER",
      event.id
    );

    if (added) {
      setQuantities((prev) => ({ ...prev, [ep.id]: quantity }));
      toast.success(t("eventsDetail.addedToCart"));
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 via-white to-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-primary shadow-sm">
                <CalendarDays className="h-4 w-4" />
                {t("eventsDetail.availableProducts")}
              </div>
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <div className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>
                    {event.city}, {event.region}
                  </span>
                </div>
                <span className="text-gray-400">•</span>
                <div className="inline-flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    {new Date(event.startDate).toLocaleDateString()} -{" "}
                    {new Date(event.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-white/70 px-4 py-2 text-sm text-gray-700 shadow-sm border border-primary/20">
              {t("eventsDetail.organizedBy")} {event.organizer.name}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-0 overflow-hidden border-primary/15 shadow-sm">
            {carouselImages.length > 0 ? (
              <ImageCarousel
                images={carouselImages}
                editable={false}
                height="h-72"
                emptyLabel={t("eventsDetail.noImage")}
              />
            ) : (
              <div className="w-full h-72 bg-primary/5 text-primary flex items-center justify-center">
                {t("eventsDetail.noImage")}
              </div>
            )}
          </Card>

          <Card className="p-5 space-y-3 border-primary/15 bg-white/90 shadow-sm">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">
                  {new Date(event.startDate).toLocaleDateString()} -{" "}
                  {new Date(event.endDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {eventHasNotStarted
                    ? t("eventsDetail.preorder")
                    : t("eventsDetail.eventStarted")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <MapPin className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">{event.city}</p>
                <p className="text-xs text-gray-500">
                  {event.street}, {event.region}
                </p>
              </div>
            </div>
            {event.description && (
              <p className="text-sm text-gray-700 leading-relaxed border-t pt-3">
                {event.description}
              </p>
            )}
          </Card>
        </div>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold">
                {t("eventsDetail.availableProducts")}
              </h3>
              <p className="text-sm text-gray-500">
                {products.length} {t("eventsDetail.availableProducts").toLowerCase()}
              </p>
            </div>
          </div>

          {groupedProducts.length === 0 ? (
            <Card className="p-6 text-gray-500 bg-white/90 border-primary/15">
              {t("eventsDetail.noProducts")}
            </Card>
          ) : (
            groupedProducts.map((group) => {
              const totalPages = Math.max(
                1,
                Math.ceil(group.products.length / PRODUCTS_PER_FARMER_PAGE)
              );
              const currentPage = Math.min(
                farmerPages[group.farmerId] ?? 1,
                totalPages
              );
              const startIndex = (currentPage - 1) * PRODUCTS_PER_FARMER_PAGE;
              const paginatedProducts = group.products.slice(
                startIndex,
                startIndex + PRODUCTS_PER_FARMER_PAGE
              );

              return (
                <Card
                  key={group.farmerId}
                  className="p-5 border-primary/15 bg-white/90 shadow-sm space-y-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold">
                          {group.farmerName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {t("eventsDetail.soldBy")} {group.farmerName}
                        </p>
                      </div>
                    </div>
                    {totalPages > 1 && (
                      <PaginationControls
                        page={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) =>
                          setFarmerPages((prev) => ({
                            ...prev,
                            [group.farmerId]: page,
                          }))
                        }
                        prevLabel={t("pagination.previous")}
                        nextLabel={t("pagination.next")}
                      />
                    )}
                  </div>

                  {paginatedProducts.length === 0 ? (
                    <p className="text-gray-500 text-sm">
                      {t("eventsDetail.noProducts")}
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedProducts.map((ep) => (
                        <Card
                          key={ep.id}
                          className="p-4 border border-gray-100 bg-white/95 shadow-sm flex flex-col gap-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <Link
                                to="/events/$id/products/$productId"
                                params={{
                                  id: String(event.id),
                                  productId: String(ep.id),
                                }}
                                className="font-semibold text-gray-800 transition-colors hover:text-primary hover:underline"
                              >
                                {ep.product.name}
                              </Link>
                              <Link
                                to="/events/$id/products/$productId"
                                params={{
                                  id: String(event.id),
                                  productId: String(ep.id),
                                }}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                {t("eventsDetail.viewProduct")}
                              </Link>
                            </div>
                            {ep.product.images?.[0]?.url ? (
                              <img
                                src={ep.product.images[0].url}
                                alt={ep.product.name}
                                className="w-full h-32 object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-32 bg-primary/5 text-primary flex items-center justify-center rounded">
                                {t("eventsDetail.noImage")}
                              </div>
                            )}
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary inline-flex items-center gap-2">
                                  {getCategoryLabel(ep.product.category, t)}
                                </span>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                                  {t("productCard.stock")}: {ep.stock ?? 0}
                                </span>
                              </div>
                              <span className="font-semibold text-gray-800">
                                €
                                {(ep.price ?? ep.product.basePrice ?? 0).toFixed(
                                  2
                                )}
                              </span>
                            </div>
                            {ep.product.description && (
                              <p className="text-xs text-gray-500 line-clamp-2">
                                {ep.product.description}
                              </p>
                            )}
                          </div>

                          {eventHasNotStarted ? (
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">
                                  {t("cartPage.quantity")}
                                </label>
                                <Input
                                  type="number"
                                  min={1}
                                  max={ep.stock ?? undefined}
                                  value={quantities[ep.id] ?? 1}
                                  className="w-24"
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      ep,
                                      e.target.valueAsNumber
                                    )
                                  }
                                />
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => handleAddToPreorder(ep)}
                              >
                                {t("eventsDetail.preorder")}
                              </Button>
                            </div>
                          ) : (
                            <p className="text-center text-red-500 text-xs">
                              {t("eventsDetail.eventStarted")}
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </section>
      </div>
    </div>
  );
}
