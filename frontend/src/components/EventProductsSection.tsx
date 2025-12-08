import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useEffect, useMemo, useCallback } from "react";
import { z } from "zod";
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
import type { TFunction } from "i18next";
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

const buildEventProductSchema = (t: TFunction) => {
  const priceField = z
    .number()
    .refine((val) => !Number.isNaN(val), {
      message: t("eventProducts.errors.priceType"),
    })
    .min(0, { message: t("eventProducts.errors.priceMin") });

  const stockField = z
    .number()
    .int()
    .refine((val) => !Number.isNaN(val), {
      message: t("eventProducts.errors.stockType"),
    })
    .min(0, { message: t("eventProducts.errors.stockMin") });

  return z.object({
    name: z.string().min(2, t("eventProducts.errors.name")),
    category: z.enum(PRODUCT_CATEGORIES, {
      message: t("eventProducts.errors.category"),
    }),
    description: z.string().min(5, t("eventProducts.errors.description")),
    price: priceField,
    stock: stockField,
    eventId: z.number(),
  });
};
type EventProductForm = z.infer<ReturnType<typeof buildEventProductSchema>>;

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
  const schema = useMemo(() => buildEventProductSchema(t), [t]);

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
    price: 0,
    stock: 0,
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
  }, [form, getInitialValues]);

  const addProduct = useMutation({
    mutationFn: (data: EventProductForm) =>
      apiFetch(`/event-product`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success(t("eventProducts.added"));
      resetForm();
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["event-products", eventId] });
    },
    onError: () => toast.error(t("eventProducts.addFailed")),
  });

  const updateProduct = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<EventProductForm>;
    }) =>
      apiFetch(`/event-product/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
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
      form.reset(getInitialValues());
      return;
    }

    const selected = farmProducts?.find((f) => f.id === selectedFarmProduct);
    if (selected) {
      const parsedCategory = productCategorySchema.safeParse(
        selected.product.category
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
                className="flex flex-col gap-3"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="event-product-name">
                    {t("eventProducts.nameLabel")}
                  </Label>
                  <Input
                    id="event-product-name"
                    {...form.register("name")}
                    placeholder={t("eventProducts.namePlaceholder")}
                  />
                  {errors.name?.message && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>{t("eventProducts.categoryLabel")}</Label>
                  <Controller
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <Select
                        value={field.value ?? undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t("eventProducts.categoryPlaceholder")}
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
                  {errors.category?.message && (
                    <p className="text-xs text-destructive">
                      {errors.category.message?.toString()}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="event-product-description">
                    {t("eventProducts.descriptionLabel")}
                  </Label>
                  <Textarea
                    id="event-product-description"
                    {...form.register("description")}
                    placeholder={t("eventProducts.descriptionPlaceholder")}
                  />
                  {errors.description?.message && (
                    <p className="text-xs text-destructive">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="event-product-price">
                      {t("eventProducts.priceLabel")}
                    </Label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        €
                      </span>
                      <Input
                        id="event-product-price"
                        type="number"
                        step="0.01"
                        className="pl-7"
                        {...form.register("price", { valueAsNumber: true })}
                        placeholder={t("eventProducts.pricePlaceholder")}
                      />
                    </div>
                    {errors.price?.message && (
                      <p className="text-xs text-destructive">
                        {errors.price.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="event-product-stock">
                      {t("eventProducts.stockLabel")}
                    </Label>
                    <Input
                      id="event-product-stock"
                      type="number"
                      min={0}
                      {...form.register("stock", { valueAsNumber: true })}
                      placeholder={t("eventProducts.stockPlaceholder")}
                    />
                    {errors.stock?.message && (
                      <p className="text-xs text-destructive">
                        {errors.stock.message}
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {t("eventProducts.save")}
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      resetForm();
                      setDialogOpen(false);
                    }}
                  >
                    {t("eventProducts.cancel")}
                  </Button>
                </DialogFooter>
              </form>

              <div className="rounded-lg border bg-muted/40 p-3 md:p-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    {t("eventProducts.fromFarm")}
                  </p>
                  <p className="text-xs text-gray-600">
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
                          className={`w-full rounded border p-3 text-left transition ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "hover:bg-muted"
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
              className="border rounded-md p-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="space-y-1">
                <p className="font-semibold">{ep.product.name}</p>
                <p className="text-sm text-gray-500">
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
