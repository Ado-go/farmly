import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";
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
import type { EventProduct, FarmProduct } from "@/types/farm";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { cn } from "@/lib/utils";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import {
  buildEventProductSchema,
  type EventProductForm,
} from "@/schemas/eventProductSchema";

export function EventProductsSection({ eventId }: { eventId: number }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFarmProduct, setSelectedFarmProduct] = useState<number | null>(
    null
  );
  const [editingProduct, setEditingProduct] = useState<EventProduct | null>(
    null
  );
  const [images, setImages] = useState<UploadedImage[]>([]);
  const schema = useMemo(() => buildEventProductSchema(t), [t]);
  const inputTone =
    "bg-white/80 border-emerald-100 focus-visible:ring-emerald-200 focus:border-emerald-400";

  const { data: products, isLoading } = useQuery<EventProduct[]>({
    queryKey: ["event-products", eventId],
    queryFn: async () => apiFetch(`/event-product/event/${eventId}`),
  });

  const { data: farmProducts } = useQuery<FarmProduct[]>({
    queryKey: ["farm-products"],
    queryFn: async () => apiFetch("/farm-product/all"),
  });

  const getInitialValues = useCallback((): EventProductForm => ({
    eventId,
    name: "",
    category: undefined as unknown as EventProductForm["category"],
    description: "",
    price: undefined as unknown as EventProductForm["price"],
    stock: undefined as unknown as EventProductForm["stock"],
  }), [eventId]);

  const form = useForm<EventProductForm>({
    resolver: zodResolver(schema),
    defaultValues: getInitialValues(),
  });
  const {
    formState: { errors },
  } = form;

  const resetForm = useCallback(() => {
    form.reset(getInitialValues());
    setSelectedFarmProduct(null);
    setEditingProduct(null);
    setImages([]);
  }, [form, getInitialValues]);

  const addProduct = useMutation({
    mutationFn: async (data: EventProductForm) => {
      const uploaded: UploadedImage[] = [];
      for (const img of images) {
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

      return apiFetch(`/event-product`, {
        method: "POST",
        body: JSON.stringify({
          ...data,
          images: uploaded.map((u) => ({ url: u.url, publicId: u.publicId })),
        }),
      });
    },
    onSuccess: () => {
      toast.success(t("eventProducts.added"));
      resetForm();
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["event-products", eventId] });
    },
    onError: () => toast.error(t("eventProducts.addFailed")),
  });

  const updateProduct = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<EventProductForm>;
    }) => {
      const uploaded: UploadedImage[] = [];
      for (const img of images) {
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

      return apiFetch(`/event-product/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          images: uploaded.map((u) => ({ url: u.url, publicId: u.publicId })),
        }),
      });
    },
    onSuccess: () => {
      toast.success(t("eventProducts.updated"));
      resetForm();
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["event-products", eventId] });
    },
    onError: () => toast.error(t("eventProducts.updateFailed")),
  });

  const isSubmitting = addProduct.isPending || updateProduct.isPending;
  const isEditing = Boolean(editingProduct);

  const deleteProduct = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/event-product/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("eventProducts.deleted"));
      queryClient.invalidateQueries({ queryKey: ["event-products", eventId] });
    },
    onError: () => toast.error(t("eventProducts.deleteFailed")),
  });

  const onSubmit = (data: EventProductForm) => {
    const payload = { ...data, eventId };
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data: payload });
      return;
    }
    addProduct.mutate(payload);
  };

  useEffect(() => {
    if (editingProduct) return;
    if (!selectedFarmProduct) {
      setImages([]);
      form.reset(getInitialValues());
      return;
    }

    const selected = farmProducts?.find((f) => f.id === selectedFarmProduct);
    if (selected) {
      const parsedCategory = productCategorySchema.safeParse(
        selected.product.category
      );
      setImages(
        (selected.product.images ?? []).map((img) => ({
          url: img.url,
          publicId: img.publicId,
        }))
      );
      form.reset({
        name: selected.product.name,
        category: parsedCategory.success ? parsedCategory.data : undefined,
        description: selected.product.description ?? "",
        price: selected.price,
        stock: selected.stock,
        eventId,
      });
    }
  }, [
    selectedFarmProduct,
    farmProducts,
    form,
    eventId,
    editingProduct,
    getInitialValues,
  ]);

  useEffect(() => {
    if (!editingProduct) return;
    const parsedCategory = productCategorySchema.safeParse(
      editingProduct.product.category
    );
    setImages(
      (editingProduct.product.images ?? []).map((img) => ({
        url: img.url,
        publicId: img.publicId,
      }))
    );
    form.reset({
      name: editingProduct.product.name,
      category: parsedCategory.success ? parsedCategory.data : undefined,
      description: editingProduct.product.description ?? "",
      price: editingProduct.price,
      stock: editingProduct.stock,
      eventId,
    });
    setSelectedFarmProduct(null);
  }, [editingProduct, form, eventId, getInitialValues]);

  useEffect(() => {
    if (!dialogOpen) {
      resetForm();
    }
  }, [dialogOpen, resetForm]);

  if (isLoading)
    return (
      <p className="text-sm text-gray-500">
        {t("eventProducts.loadingProducts")}
      </p>
    );

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>{t("eventProducts.title")}</CardTitle>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}
            >
              {t("eventProducts.add")}
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-3xl w-[min(95vw,820px)] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="space-y-1.5">
              <DialogTitle>
                {isEditing
                  ? t("eventProducts.editDialogTitle")
                  : t("eventProducts.addDialogTitle")}
              </DialogTitle>
              <DialogDescription>
                {t("eventProducts.dialogDescription")}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 md:grid-cols-[1.2fr,0.9fr]">
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
              >
                <div className="space-y-2">
                  <FieldLabel className="text-sm font-medium">
                    {t("product.uploadImage")}
                  </FieldLabel>
                  <ImageUploader
                    value={images}
                    onChange={setImages}
                    editable
                    height="h-48"
                  />
                </div>

                <FieldSet className="grid grid-cols-1 gap-4">
                  <Field>
                    <FieldLabel htmlFor="event-product-name">
                      {t("eventProducts.nameLabel")}
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="event-product-name"
                        {...form.register("name")}
                        placeholder={t("eventProducts.namePlaceholder")}
                        className={inputTone}
                      />
                      <FieldError
                        errors={errors.name ? [errors.name] : undefined}
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel>{t("eventProducts.categoryLabel")}</FieldLabel>
                    <FieldContent>
                      <Controller
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <Select
                            value={field.value ?? undefined}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className={`${inputTone} w-full`}>
                              <SelectValue
                                placeholder={t(
                                  "eventProducts.categoryPlaceholder"
                                )}
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
                      <FieldError
                        errors={
                          errors.category ? [errors.category] : undefined
                        }
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="event-product-description">
                      {t("eventProducts.descriptionLabel")}
                    </FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="event-product-description"
                        {...form.register("description")}
                        placeholder={t("eventProducts.descriptionPlaceholder")}
                        className={inputTone}
                      />
                      <FieldError
                        errors={
                          errors.description ? [errors.description] : undefined
                        }
                      />
                    </FieldContent>
                  </Field>

                  <FieldSet className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="event-product-price">
                        {t("eventProducts.priceLabel")}
                      </FieldLabel>
                      <FieldContent>
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                            €
                          </span>
                          <Input
                            id="event-product-price"
                            type="number"
                            step="0.01"
                            className={cn(inputTone, "pl-7")}
                            {...form.register("price", { valueAsNumber: true })}
                            placeholder={t("eventProducts.pricePlaceholder")}
                          />
                        </div>
                        <FieldError
                          errors={errors.price ? [errors.price] : undefined}
                        />
                      </FieldContent>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="event-product-stock">
                        {t("eventProducts.stockLabel")}
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="event-product-stock"
                          type="number"
                          min={0}
                          className={inputTone}
                          {...form.register("stock", { valueAsNumber: true })}
                          placeholder={t("eventProducts.stockPlaceholder")}
                        />
                        <FieldError
                          errors={errors.stock ? [errors.stock] : undefined}
                        />
                      </FieldContent>
                    </Field>
                  </FieldSet>
                </FieldSet>

                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setDialogOpen(false);
                    }}
                  >
                    {t("eventProducts.cancel")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting
                      ? t("eventProducts.saving")
                      : t("eventProducts.save")}
                  </Button>
                </div>
              </form>

              <div className="space-y-3 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-white p-4 shadow-sm">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-emerald-900">
                    {t("eventProducts.fromFarm")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("eventProducts.fromFarmHint")}
                  </p>
                </div>

                {farmProducts?.length ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {farmProducts.map((fp) => {
                      const isSelected = selectedFarmProduct === fp.id;
                      return (
                        <button
                          key={fp.id}
                          type="button"
                          className={`w-full rounded-xl border p-3 text-left transition ${
                            isSelected
                              ? "border-emerald-300 bg-emerald-50 shadow-sm"
                              : "border-emerald-50 bg-white/80 hover:border-emerald-200 hover:bg-emerald-50/70"
                          }`}
                          onClick={() => {
                            setEditingProduct(null);
                            setSelectedFarmProduct((prev) =>
                              prev === fp.id ? null : fp.id
                            );
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1">
                              <p className="font-semibold">
                                {fp.product.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {getCategoryLabel(fp.product.category, t)}
                              </p>
                            </div>
                            <div className="text-right text-xs text-gray-600 space-y-1">
                              <p>€{fp.price.toFixed(2)}</p>
                              <p>
                                {t("productCard.stock")}: {fp.stock}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">
                    {t("eventProducts.noFarmProducts")}
                  </p>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-3">
        {!products?.length ? (
          <p className="text-sm text-gray-500">
            {t("eventProducts.myProductsEmpty")}
          </p>
        ) : (
          products.map((ep) => (
            <div
              key={ep.id}
              className="border rounded-md p-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {ep.product.images?.[0]?.url ? (
                  <img
                    src={ep.product.images[0].url}
                    alt={ep.product.name}
                    className="h-16 w-16 rounded object-cover border"
                  />
                ) : (
                  <div className="h-16 w-16 rounded border bg-muted flex items-center justify-center text-[10px] text-gray-500">
                    {t("eventsDetail.noImage")}
                  </div>
                )}
                <div className="space-y-1">
                  <p className="font-semibold">{ep.product.name}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {ep.product.description}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    <span className="rounded-full bg-gray-100 px-2 py-1">
                      €{(ep.price ?? 0).toFixed(2)}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-1">
                      {t("productCard.stock")}: {ep.stock}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                      {getCategoryLabel(ep.product.category, t)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingProduct(ep);
                    setDialogOpen(true);
                  }}
                >
                  {t("eventProducts.edit")}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      {t("eventProducts.delete")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="sm:max-w-md w-[min(92vw,26rem)]">
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("eventProducts.deleteConfirmTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("eventProducts.deleteConfirmDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("eventProducts.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteProduct.mutate(ep.id)}
                      >
                        {t("eventProducts.deleteConfirmCta")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
