import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { getCategoryLabel } from "@/lib/productCategories";
import { ImageCarousel } from "@/components/ImageCarousel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/ui/field";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { type TFunction } from "i18next";
import { Loader2, Mail, Package, Sparkles, Tag, User } from "lucide-react";

export const Route = createFileRoute("/offers/$id")({
  component: OfferDetailPage,
});

type Offer = {
  id: number;
  title: string;
  description?: string;
  user: { id: number; name: string; email?: string | null };
  product: {
    id: number;
    name: string;
    category: string;
    description?: string;
    basePrice?: number;
    images?: { url: string; optimizedUrl?: string; publicId?: string }[];
  };
};

const buildRespondSchema = (t: TFunction) =>
  z.object({
    email: z
      .string()
      .trim()
      .email(t("offersPage.respond.emailError")),
    message: z
      .string()
      .trim()
      .min(10, t("offersPage.respond.messageError"))
      .max(1000, t("offersPage.respond.messageMax")),
  });

type RespondForm = z.infer<ReturnType<typeof buildRespondSchema>>;

function OfferDetailPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const respondSchema = useMemo(() => buildRespondSchema(t), [t]);
  const { id } = Route.useParams();
  const [respondOpen, setRespondOpen] = useState(false);
  const respondForm = useForm<RespondForm>({
    resolver: zodResolver(respondSchema),
    defaultValues: {
      email: user?.email ?? "",
      message: "",
    },
  });
  const {
    formState: { errors },
  } = respondForm;
  const {
    data: offer,
    isLoading,
    isError,
  } = useQuery<Offer>({
    queryKey: ["offerDetail", id],
    queryFn: async () => apiFetch(`/offer/${id}`),
  });
  const respondToOffer = useMutation({
    mutationFn: async (payload: RespondForm) =>
      apiFetch(`/offer/${id}/respond`, {
        method: "POST",
        body: payload,
      }),
    onSuccess: () => {
      toast.success(t("offersPage.respond.success"));
      setRespondOpen(false);
      respondForm.reset({
        email: user?.email ?? "",
        message: "",
      });
    },
    onError: (err: Error) => {
      toast.error(err?.message || t("offersPage.respond.error"));
    },
  });

  useEffect(() => {
    if (user?.email) {
      respondForm.setValue("email", user.email);
    }
  }, [respondForm, user?.email]);

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

  const productCategoryLabel = getCategoryLabel(offer.product.category, t);
  const price = offer.product?.basePrice ?? 0;
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
                {productCategoryLabel}
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

            <div className="flex w-full flex-col items-end gap-3 sm:w-auto">
              <div className="w-full rounded-xl border border-primary/20 bg-white px-4 py-3 text-right shadow-sm sm:w-auto">
                <p className="text-xs text-gray-500">
                  {t("offersPage.priceLabel")}
                </p>
                <p className="text-3xl font-bold text-primary">
                  {price.toFixed(2)} €
                </p>
              </div>
              <Dialog
                open={respondOpen}
                onOpenChange={(open) => {
                  setRespondOpen(open);
                  if (!open) {
                    respondForm.reset({
                      email:
                        respondForm.getValues("email") ||
                        user?.email ||
                        "",
                      message: "",
                    });
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="w-full gap-2 rounded-full px-4 shadow-sm sm:w-auto"
                    variant="default"
                  >
                    {respondToOffer.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t("offersPage.respond.sending")}
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        {t("offersPage.respond.cta")}
                      </>
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[min(95vw,40rem)] max-w-2xl max-h-[90vh] overflow-y-auto border-primary/10 bg-white/95 shadow-2xl sm:max-h-[85vh]">
                  <DialogHeader>
                    <DialogTitle>{t("offersPage.respond.title")}</DialogTitle>
                    <DialogDescription className="text-left">
                      {t("offersPage.respond.description", {
                        seller: offer.user?.name ?? t("offersPage.seller"),
                      })}
                    </DialogDescription>
                  </DialogHeader>

                  <form
                    className="space-y-4 rounded-lg border border-primary/10 bg-white/70 p-4 shadow-sm"
                    onSubmit={respondForm.handleSubmit((values) =>
                      respondToOffer.mutate(values)
                    )}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="respondEmail">
                        {t("offersPage.respond.emailLabel")}
                      </Label>
                      <Input
                        id="respondEmail"
                        type="email"
                        placeholder={t("offersPage.respond.emailPlaceholder")}
                        autoComplete="email"
                        disabled={respondToOffer.isPending}
                        className="w-full"
                        {...respondForm.register("email")}
                      />
                      <FieldError>{errors.email?.message}</FieldError>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="respondMessage">
                        {t("offersPage.respond.messageLabel")}
                      </Label>
                      <Textarea
                        id="respondMessage"
                        rows={4}
                        placeholder={t("offersPage.respond.messagePlaceholder")}
                        disabled={respondToOffer.isPending}
                        className="w-full max-w-full resize-y"
                        {...respondForm.register("message")}
                      />
                      <FieldError>{errors.message?.message}</FieldError>
                    </div>

                    <DialogFooter className="pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setRespondOpen(false)}
                        disabled={respondToOffer.isPending}
                      >
                        {t("offersPage.cancel")}
                      </Button>
                      <Button
                        type="submit"
                        className="gap-2"
                        disabled={respondToOffer.isPending}
                      >
                        {respondToOffer.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t("offersPage.respond.sending")}
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4" />
                            {t("offersPage.respond.send")}
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
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
                      {productCategoryLabel}
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
                    {price.toFixed(2)} €
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
