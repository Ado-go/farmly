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
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiFetch } from "@/lib/api";
import { useTranslation } from "react-i18next";

const eventProductSchema = z.object({
  name: z.string().min(2, "Názov je povinný"),
  category: z.string().min(2, "Kategória je povinná"),
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

  const { data: products, isLoading } = useQuery({
    queryKey: ["event-products", eventId],
    queryFn: async () =>
      apiFetch(`/event-product/event/${eventId}`) as Promise<any[]>,
  });

  const { data: farmProducts } = useQuery({
    queryKey: ["farm-products"],
    queryFn: async () => apiFetch("/farm-product/all") as Promise<any[]>,
  });

  const form = useForm<EventProductForm>({
    resolver: zodResolver(eventProductSchema),
    defaultValues: { eventId },
  });

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
      queryClient.invalidateQueries(["event-products", eventId]);
    },
    onError: () => toast.error(t("eventProducts.addFailed")),
  });

  const deleteProduct = useMutation({
    mutationFn: (id: number) =>
      apiFetch(`/event-product/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("eventProducts.deleted"));
      queryClient.invalidateQueries(["event-products", eventId]);
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
      form.reset({
        name: selected.product.name,
        category: selected.product.category,
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

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("eventProducts.addDialogTitle")}</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-2 mt-2"
            >
              <Input
                {...form.register("name")}
                placeholder={t("eventProducts.namePlaceholder")}
              />
              <Input
                {...form.register("category")}
                placeholder={t("eventProducts.categoryPlaceholder")}
              />
              <Textarea
                {...form.register("description")}
                placeholder={t("eventProducts.descriptionPlaceholder")}
              />
              <Input
                type="number"
                step="0.01"
                {...form.register("basePrice", { valueAsNumber: true })}
                placeholder={t("eventProducts.pricePlaceholder")}
              />

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
                        {fp.product.category}
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
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteProduct.mutate(ep.id)}
              >
                {t("eventProducts.delete")}
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
