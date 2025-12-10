import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { ImageCarousel } from "@/components/ImageCarousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import {
  PRODUCT_CATEGORIES,
  getCategoryLabel,
  productCategorySchema,
} from "@/lib/productCategories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError } from "@/components/ui/field";

export const Route = createFileRoute("/offers/my/")({
  component: OffersMyPage,
});

const nonNegativeNumber = (requiredKey: string, minKey: string) =>
  z
    .number({ message: requiredKey })
    .refine((value) => Number.isFinite(value), { message: requiredKey })
    .gt(0, { message: minKey });

const offerSchema = z.object({
  title: z
    .string({ message: "offersPage.errors.titleRequired" })
    .trim()
    .min(3, { message: "offersPage.errors.titleRequired" }),
  description: z.string().optional(),
  productName: z
    .string({ message: "offersPage.errors.productNameRequired" })
    .trim()
    .min(2, { message: "offersPage.errors.productNameRequired" }),
  productDescription: z.string().optional(),
  productCategory: z.enum(PRODUCT_CATEGORIES, {
    message: "offersPage.errors.productCategoryRequired",
  }),
  productPrice: nonNegativeNumber(
    "offersPage.errors.productPriceRequired",
    "offersPage.errors.productPriceMin"
  ),
});

type OfferFormData = z.infer<typeof offerSchema>;

type Offer = {
  id: number;
  title: string;
  description?: string;
  userId?: number;
  product: {
    id: number;
    name: string;
    description?: string;
    category: string;
    basePrice?: number;
    images?: { url: string; publicId: string }[];
  };
};

function OffersMyPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);

  const {
    data: offers = [],
    isLoading,
    isError,
  } = useQuery<Offer[]>({
    queryKey: ["offersMy"],
    queryFn: async () => await apiFetch("/offer/my"),
  });

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: "",
      description: "",
      productName: "",
      productDescription: "",
      productCategory: undefined,
      productPrice: undefined,
    },
  });

  const { errors } = form.formState;

  const getInputClass = (hasError?: boolean) =>
    `h-11 border-primary/25 bg-white shadow-sm ${
      hasError
        ? "border-red-500 focus-visible:ring-red-500"
        : "focus-visible:ring-primary/40"
    }`;

  const getTextareaClass = (hasError?: boolean) =>
    `min-h-[110px] border-primary/25 bg-white shadow-sm ${
      hasError
        ? "border-red-500 focus-visible:ring-red-500"
        : "focus-visible:ring-primary/40"
    }`;

  const getSelectClass = (hasError?: boolean) =>
    `w-full h-11 border-primary/25 bg-white shadow-sm ${
      hasError
        ? "border-red-500 focus-visible:ring-red-500"
        : "focus-visible:ring-primary/40"
    }`;

  const renderError = (error?: { message?: string }) =>
    error?.message ? t(error.message) : null;

  useEffect(() => {
    if (editingOffer) {
      const parsedProductCategory = productCategorySchema.safeParse(
        editingOffer.product?.category
      );

      form.reset({
        title: editingOffer.title,
        description: editingOffer.description,
        productName: editingOffer.product?.name || "",
        productDescription: editingOffer.product?.description || "",
        productCategory: parsedProductCategory.success
          ? parsedProductCategory.data
          : undefined,
        productPrice: editingOffer.product?.basePrice,
      });
      setImages(
        (editingOffer.product?.images ?? []).map((img) => ({
          url: img.url,
          publicId: img.publicId,
        }))
      );
    } else {
      form.reset({
        title: "",
        description: "",
        productName: "",
        productDescription: "",
        productCategory: undefined,
        productPrice: undefined,
      });
      setImages([]);
    }
  }, [editingOffer, form]);

  const uploadImages = async (currentImages: UploadedImage[]) => {
    const uploaded: UploadedImage[] = [];
    for (const img of currentImages) {
      if (img.file) {
        const formData = new FormData();
        formData.append("image", img.file);
        const res = await apiFetch("/upload", {
          method: "POST",
          body: formData,
        });
        uploaded.push(res);
      } else {
        uploaded.push(img);
      }
    }
    return uploaded;
  };

  const createOffer = useMutation({
    mutationFn: async (data: OfferFormData) => {
      const uploaded = await uploadImages(images);
      const payload = {
        title: data.title,
        description: data.description,
        product: {
          name: data.productName,
          category: data.productCategory,
          description: data.productDescription,
          basePrice: Number(data.productPrice),
          images: uploaded
            .filter((img) => img.url && img.publicId)
            .map((img) => ({
              url: img.url,
              publicId: img.publicId as string,
            })),
        },
      };
      return apiFetch("/offer", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(t("offersPage.created"));
      queryClient.invalidateQueries({ queryKey: ["offersMy"] });
      setOpen(false);
      setEditingOffer(null);
      form.reset();
      setImages([]);
    },
    onError: () => {
      toast.error(t("offersPage.createError"));
    },
  });

  const updateOffer = useMutation({
    mutationFn: async (data: OfferFormData) => {
      if (!editingOffer) return;
      const uploaded = await uploadImages(images);
      const payload = {
        title: data.title,
        description: data.description,
        product: {
          name: data.productName,
          category: data.productCategory,
          description: data.productDescription,
          basePrice: Number(data.productPrice),
          images: uploaded
            .filter((img) => img.url && img.publicId)
            .map((img) => ({
              url: img.url,
              publicId: img.publicId as string,
            })),
        },
      };
      return apiFetch(`/offer/${editingOffer.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(t("offersPage.updated"));
      queryClient.invalidateQueries({ queryKey: ["offersMy"] });
      setOpen(false);
      setEditingOffer(null);
      setTimeout(() => form.reset(), 150);
      setImages([]);
    },
    onError: () => {
      toast.error(t("offersPage.updateError"));
    },
  });

  const deleteOffer = useMutation({
    mutationFn: async (id: number) =>
      await apiFetch(`/offer/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("offersPage.deleted"));
      queryClient.invalidateQueries({ queryKey: ["offersMy"] });
    },
    onError: () => {
      toast.error(t("offersPage.deleteError"));
    },
  });

  const handleOpenCreate = () => {
    setEditingOffer(null);
    setImages([]);
    form.reset();
    setOpen(true);
  };

  if (isLoading)
    return <div className="py-10 text-center">{t("offersPage.loading")}</div>;
  if (isError)
    return (
      <div className="py-10 text-center text-red-500">
        {t("offersPage.errorLoading")}
      </div>
    );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-6xl space-y-8 p-6">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-6 shadow-sm">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.08),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(251,191,36,0.1),transparent_32%)]" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
                {t("offersPage.title")}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <h2 className="text-3xl font-bold text-slate-900">
                  {t("offersPage.myTitle")}
                </h2>
                <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {t("offersPage.totalOffers", { count: offers.length })}
                </span>
              </div>
              <p className="max-w-3xl text-sm text-muted-foreground">
                {t("offersPage.subtitle")}
              </p>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenCreate} className="shadow-sm">
                  {t("offersPage.createButton")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-primary/10 bg-white/95 shadow-2xl sm:max-h-[85vh]">
                <DialogHeader className="space-y-1">
                  <DialogTitle className="text-2xl">
                    {editingOffer
                      ? t("offersPage.editTitle")
                      : t("offersPage.createTitle")}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground">
                    {t("offersPage.subtitle")}
                  </p>
                </DialogHeader>

                <form
                  onSubmit={form.handleSubmit((data) =>
                    editingOffer
                      ? updateOffer.mutate(data)
                      : createOffer.mutate(data)
                  )}
                  className="space-y-5"
                  noValidate
                >
                  <div className="space-y-4 rounded-xl border border-primary/10 bg-white/70 p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary/70" />
                      <h4 className="text-sm font-semibold text-slate-800">
                        {t("offersPage.offerDetails")}
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label
                          htmlFor="title"
                          className="text-sm font-semibold text-slate-800"
                        >
                          {t("offersPage.titleLabel")}
                        </Label>
                        <Input
                          id="title"
                          {...form.register("title")}
                          placeholder={t("offersPage.titleLabel")}
                          className={getInputClass(!!errors.title)}
                          aria-invalid={!!errors.title}
                        />
                        <FieldError>{renderError(errors.title)}</FieldError>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label
                          htmlFor="description"
                          className="text-sm font-semibold text-slate-800"
                        >
                          {t("offersPage.descriptionLabel")}
                        </Label>
                        <Textarea
                          id="description"
                          {...form.register("description")}
                          placeholder={t("offersPage.descriptionLabel")}
                          className={getTextareaClass(!!errors.description)}
                          aria-invalid={!!errors.description}
                        />
                        <FieldError>{renderError(errors.description)}</FieldError>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-xl border border-primary/10 bg-white/70 p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <h4 className="text-sm font-semibold text-slate-800">
                        {t("offersPage.productDetails")}
                      </h4>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-800">
                        {t("offersPage.productImagesLabel")}
                      </Label>
                      <ImageUploader
                        value={images}
                        onChange={setImages}
                        editable
                        height="h-40"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label
                          htmlFor="productName"
                          className="text-sm font-semibold text-slate-800"
                        >
                          {t("offersPage.productNameLabel")}
                        </Label>
                        <Input
                          id="productName"
                          {...form.register("productName")}
                          placeholder={t("offersPage.productNameLabel")}
                          className={getInputClass(!!errors.productName)}
                          aria-invalid={!!errors.productName}
                        />
                        <FieldError>{renderError(errors.productName)}</FieldError>
                      </div>

                      <div className="space-y-2 sm:col-span-2">
                        <Label
                          htmlFor="productDescription"
                          className="text-sm font-semibold text-slate-800"
                        >
                          {t("offersPage.productDescriptionLabel")}
                        </Label>
                        <Textarea
                          id="productDescription"
                          {...form.register("productDescription")}
                          placeholder={t("offersPage.productDescriptionLabel")}
                          className={getTextareaClass(
                            !!errors.productDescription
                          )}
                          aria-invalid={!!errors.productDescription}
                        />
                        <FieldError>
                          {renderError(errors.productDescription)}
                        </FieldError>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="productCategory"
                          className="text-sm font-semibold text-slate-800"
                        >
                          {t("offersPage.productCategoryLabel")}
                        </Label>
                        <Controller
                          control={form.control}
                          name="productCategory"
                          render={({ field }) => (
                            <Select
                              value={field.value ?? undefined}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger
                                id="productCategory"
                                className={getSelectClass(
                                  !!errors.productCategory
                                )}
                                aria-invalid={!!errors.productCategory}
                              >
                                <SelectValue
                                  placeholder={t("offersPage.productCategoryLabel")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {PRODUCT_CATEGORIES.map((value) => (
                                  <SelectItem key={value} value={value}>
                                    {t(`productCategories.${value}`)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FieldError>
                          {renderError(errors.productCategory)}
                        </FieldError>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="productPrice"
                          className="text-sm font-semibold text-slate-800"
                        >
                          {t("offersPage.productPriceLabel")}
                        </Label>
                        <Input
                          id="productPrice"
                          type="number"
                          step="0.01"
                          {...form.register("productPrice", {
                            valueAsNumber: true,
                          })}
                          placeholder={t("offersPage.productPriceLabel")}
                          className={getInputClass(!!errors.productPrice)}
                          aria-invalid={!!errors.productPrice}
                        />
                        <FieldError>{renderError(errors.productPrice)}</FieldError>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setOpen(false)}
                    >
                      {t("offersPage.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      disabled={createOffer.isPending || updateOffer.isPending}
                    >
                      {createOffer.isPending || updateOffer.isPending
                        ? t("offersPage.saving")
                        : editingOffer
                          ? t("offersPage.update")
                          : t("offersPage.create")}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {offers.length === 0 ? (
          <Card className="border-primary/10 bg-white/80 p-8 text-center shadow-sm backdrop-blur">
            <p className="text-muted-foreground">{t("offersPage.noOffers")}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <Card
                key={offer.id}
                className="group relative overflow-hidden border-primary/15 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="absolute inset-x-4 top-0 h-1 rounded-b-full bg-gradient-to-r from-primary via-emerald-500 to-amber-400 opacity-80" />
                <div className="space-y-3 pt-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {offer.title}
                      </h3>
                      {offer.product?.name && (
                        <p className="text-sm text-muted-foreground">
                          {offer.product.name}
                        </p>
                      )}
                    </div>
                    <span className="rounded-full border border-primary/25 bg-primary/5 px-2 py-1 text-xs font-medium text-primary">
                      {offer.product?.category
                        ? getCategoryLabel(offer.product.category, t)
                        : t("offersPage.categoryPlaceholder")}
                    </span>
                  </div>
                  <ImageCarousel
                    images={offer.product?.images ?? []}
                    height="h-40"
                    emptyLabel={t("offersPage.noImage")}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-semibold text-slate-900">
                      {(offer.product?.basePrice ?? 0).toFixed(2)} €
                    </p>
                    {offer.product?.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {offer.product.description}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditingOffer(offer);
                        setOpen(true);
                      }}
                    >
                      {t("offersPage.edit")}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          disabled={deleteOffer.isPending}
                        >
                          {deleteOffer.isPending
                            ? t("offersPage.deleting")
                            : t("offersPage.delete")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("offersPage.confirmDeleteTitle")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("offersPage.confirmDeleteText")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t("offersPage.cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteOffer.mutate(offer.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {t("offersPage.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
