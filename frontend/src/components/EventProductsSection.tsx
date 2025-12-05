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
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";
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

const eventProductSchema = z.object({
  name: z.string().min(2, "Názov je povinný"),
  category: productCategorySchema,
  description: z.string().min(5, "Popis je povinný"),
  basePrice: z.number().min(0).optional(),
  eventId: z.number(),
});
type EventProductForm = z.infer<typeof eventProductSchema>;

export function EventProductsSection({ eventId }: { eventId: number }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFarmProduct, setSelectedFarmProduct] = useState<number | null>(
    null
  );

  const { data: products, isLoading } = useQuery<EventProduct[]>({
    queryKey: ["event-products", eventId],
    queryFn: async () => apiFetch(`/event-product/event/${eventId}`),
  });

  const { data: farmProducts } = useQuery<FarmProduct[]>({
    queryKey: ["farm-products"],
    queryFn: async () => apiFetch("/farm-product/all"),
  });

  const form = useForm<EventProductForm>({
    resolver: zodResolver(eventProductSchema),
    defaultValues: { eventId },
  });
  const {
    formState: { errors },
  } = form;

  const addProduct = useMutation({
    mutationFn: (data: EventProductForm) =>
      apiFetch(`/event-product`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success(t("eventProducts.added"));
      form.reset();
      setSelectedFarmProduct(null);
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["event-products", eventId] });
    },
    onError: () => toast.error(t("eventProducts.addFailed")),
  });

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
    addProduct.mutate({ ...data, eventId });
  };

  useEffect(() => {
    if (!selectedFarmProduct) {
      form.reset({ eventId });
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
        description: selected.product.description,
        basePrice: selected.product.basePrice ?? 0,
        eventId,
      });
    }
  }, [selectedFarmProduct, farmProducts, form, eventId]);

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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>{t("eventProducts.add")}</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg w-[min(92vw,34rem)] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("eventProducts.addDialogTitle")}</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-3 mt-2"
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
                  <p className="text-xs text-destructive">{errors.name.message}</p>
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

              <div className="space-y-1.5">
                <Label htmlFor="event-product-price">
                  {t("eventProducts.priceLabel")}
                </Label>
                <Input
                  id="event-product-price"
                  type="number"
                  step="0.01"
                  {...form.register("basePrice", { valueAsNumber: true })}
                  placeholder={t("eventProducts.pricePlaceholder")}
                />
                {errors.basePrice?.message && (
                  <p className="text-xs text-destructive">
                    {errors.basePrice.message}
                  </p>
                )}
              </div>

              <DialogFooter className="flex justify-end mt-2 gap-2">
                <Button type="submit" disabled={addProduct.isPending}>
                  {t("eventProducts.save")}
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    form.reset({ eventId });
                    setSelectedFarmProduct(null);
                    setDialogOpen(false);
                  }}
                >
                  {t("eventProducts.cancel")}
                </Button>
              </DialogFooter>
            </form>

            <div className="border-t mt-4 pt-4">
              <p className="text-sm mb-2 text-gray-500">
                {t("eventProducts.fromFarm")}
              </p>

              {farmProducts?.length ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {farmProducts.map((fp) => (
                    <div
                      key={fp.id}
                      className={`p-2 border rounded cursor-pointer ${
                        selectedFarmProduct === fp.id
                          ? "bg-green-50 border-green-400"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() =>
                        setSelectedFarmProduct((prev) =>
                          prev === fp.id ? null : fp.id
                        )
                      }
                    >
                      <p className="font-medium">{fp.product.name}</p>
                      <p className="text-xs text-gray-500">
                        {getCategoryLabel(fp.product.category, t)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  {t("eventProducts.noFarmProducts")}
                </p>
              )}
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
              className="border rounded-md p-3 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{ep.product.name}</p>
                <p className="text-sm text-gray-500">
                  {ep.product.description}
                </p>
                <p className="text-sm text-gray-500">
                  {ep.product.basePrice?.toFixed(2)} €
                </p>
              </div>
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
          ))
        )}
      </CardContent>
    </Card>
  );
}
