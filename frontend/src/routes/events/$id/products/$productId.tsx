import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { getCategoryLabel } from "@/lib/productCategories";
import { ImageCarousel } from "@/components/ImageCarousel";
import { ArrowLeft, CalendarDays, MapPin, Store } from "lucide-react";
import { useCart } from "@/context/CartContext";
import type { EventDetail } from "@/types/events";
import { toast } from "sonner";

export const Route = createFileRoute("/events/$id/products/$productId")({
  component: EventProductDetailPage,
});

function EventProductDetailPage() {
  const { id, productId } = Route.useParams();
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery<EventDetail>({
    queryKey: ["event", id],
    queryFn: async () => apiFetch(`/public-events/${id}`),
  });

  const stallMap = useMemo(
    () =>
      new Map(
        (event?.participants ?? []).map((p) => {
          const normalized = p.stallName?.trim();
          return [p.id, normalized || null];
        })
      ),
    [event?.participants]
  );

  const eventProduct = useMemo(
    () =>
      event?.eventProducts?.find((ep) => String(ep.id) === productId) ?? null,
    [event?.eventProducts, productId]
  );
  const stallNameValue =
    eventProduct && eventProduct.user
      ? eventProduct.stallName ?? stallMap.get(eventProduct.user.id) ?? null
      : null;
  const stallName =
    stallNameValue && typeof stallNameValue === "string"
      ? stallNameValue.trim() || null
      : stallNameValue ?? null;

  useEffect(() => {
    if (eventProduct?.product.name) {
      document.title = `${eventProduct.product.name} | ${t(
        "eventsDetail.productDetailsTitle"
      )}`;
    }
  }, [eventProduct?.product.name, t]);

  if (isLoading)
    return (
      <p className="mt-10 text-center text-gray-500">
        {t("eventsDetail.loading")}
      </p>
    );

  if (isError || !event)
    return (
      <p className="mt-10 text-center text-red-500">
        {t("eventsDetail.errorLoading")}
      </p>
    );

  if (!eventProduct)
    return (
      <div className="p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <Link to="/events/$id" params={{ id }}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("eventsDetail.backToEvent")}
            </Button>
          </Link>
          <Card className="border-primary/15 bg-white/90 p-6 text-gray-700 shadow-sm">
            {t("eventsDetail.productNotFound")}
          </Card>
        </div>
      </div>
    );

  const productImages =
    eventProduct.product.images?.map((img) => ({
      url: img.url,
    })) ?? [];

  const price = eventProduct.price ?? eventProduct.product.basePrice ?? 0;
  const eventHasNotStarted = new Date(event.startDate) > new Date();

  const normalizeQuantity = (value: number) => {
    const maxQty =
      eventProduct.stock && eventProduct.stock > 0
        ? eventProduct.stock
        : Number.MAX_SAFE_INTEGER;
    return Math.max(1, Math.min(Math.floor(value), maxQty));
  };

  const handleQuantityChange = (value: number) => {
    if (Number.isNaN(value)) return;
    setQuantity(normalizeQuantity(value));
  };

  const handleAddToPreorder = () => {
    const finalQuantity = normalizeQuantity(quantity);
    const added = addToCart(
      {
        productId: eventProduct.product.id,
        productName: eventProduct.product.name,
        sellerName: eventProduct.user.name,
        stallName: stallName ?? undefined,
        unitPrice: price,
        quantity: finalQuantity,
        stock: eventProduct.stock,
      },
      "PREORDER",
      event.id
    );

    if (added) {
      setQuantity(finalQuantity);
      toast.success(t("eventsDetail.addedToCart"));
    }
  };

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link to="/events/$id" params={{ id }}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("eventsDetail.backToEvent")}
            </Button>
          </Link>
          <span className="text-sm text-gray-600">
            {t("eventsDetail.organizedBy")} {event.organizer.name}
          </span>
        </div>

        <Card className="overflow-hidden border-primary/15 bg-white/90 shadow-sm">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="bg-primary/5">
              {productImages.length ? (
                <ImageCarousel
                  images={productImages}
                  editable={false}
                  height="h-80"
                  emptyLabel={t("eventsDetail.noImage")}
                />
              ) : (
                <div className="flex h-80 items-center justify-center text-primary">
                  {t("eventsDetail.noImage")}
                </div>
              )}
            </div>
            <div className="space-y-4 p-6">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-primary">
                  {t("eventsDetail.productDetailsTitle")}
                </p>
                <h1 className="text-3xl font-bold text-gray-900">
                  {eventProduct.product.name}
                </h1>
                <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                  <Store className="h-4 w-4 text-primary" />
                  <span className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                    <span>
                      {t("eventsDetail.soldBy")} {eventProduct.user.name}
                    </span>
                    {stallName ? (
                      <span className="text-xs text-primary">
                        {t("eventsDetail.stallLabel", { stall: stallName })}
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                  {getCategoryLabel(eventProduct.product.category, t)}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {t("productCard.stock")}: {eventProduct.stock ?? 0}
                </span>
              </div>

              {eventProduct.product.description && (
                <p className="leading-relaxed text-gray-700">
                  {eventProduct.product.description}
                </p>
              )}

              <div className="flex flex-col gap-4 rounded-lg border border-primary/15 bg-primary/5 p-4">
                <div className="flex items-end justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-gray-500">
                      {t("eventProducts.priceLabel")}
                    </p>
                    <p className="text-3xl font-bold text-primary">
                      €{price.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">
                      {t("cartPage.quantity")}
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={eventProduct.stock ?? undefined}
                      value={quantity}
                      className="w-24"
                      onChange={(e) =>
                        handleQuantityChange(e.target.valueAsNumber)
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={handleAddToPreorder}
                    disabled={
                      !eventHasNotStarted || (eventProduct.stock ?? 0) === 0
                    }
                    className="w-full"
                  >
                    {eventHasNotStarted
                      ? t("eventsDetail.preorder")
                      : t("eventsDetail.eventStarted")}
                  </Button>
                  {!eventHasNotStarted && (
                    <p className="text-center text-xs text-red-500">
                      {t("eventsDetail.eventStarted")}
                    </p>
                  )}
                  {eventProduct.stock !== undefined &&
                    eventProduct.stock !== null &&
                    eventProduct.stock <= 0 && (
                      <p className="text-center text-xs text-red-500">
                        {t("productCard.stock")}: 0
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="space-y-3 border-primary/15 bg-white/90 p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
            <div className="inline-flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <span>
                {new Date(event.startDate).toLocaleDateString()} -{" "}
                {new Date(event.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="inline-flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <span>
                {event.city}, {event.street}, {event.region}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
