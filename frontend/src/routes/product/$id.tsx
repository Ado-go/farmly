import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { apiFetch } from "../../lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
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

const productSchema = z.object({
  name: z.string().min(2, "Názov je povinný"),
  category: productCategorySchema,
  description: z.string().optional(),
  price: z.number().min(0, "Cena musí byť väčšia ako 0"),
  stock: z.number().min(0, "Sklad musí byť nezáporný"),
});

type ProductFormData = z.infer<typeof productSchema>;

export const Route = createFileRoute("/product/$id")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const {
    data: farmProduct,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["farmProduct", id],
    queryFn: async () => await apiFetch(`/farm-product/${id}`),
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (farmProduct) {
      form.reset({
        name: farmProduct.product.name,
        category: farmProduct.product.category,
        description: farmProduct.product.description,
        price: farmProduct.price,
        stock: farmProduct.stock,
      });
    }
  }, [farmProduct, form]);

  const editProduct = useMutation({
    mutationFn: async (data: ProductFormData) =>
      apiFetch(`/farm-product/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: data.name,
          category: data.category,
          description: data.description,
          price: data.price,
          stock: data.stock,
        }),
      }),
    onSuccess: () => {
      toast.success(t("productPage.editSuccess"));
      queryClient.invalidateQueries({ queryKey: ["farmProduct", id] });
      setEditing(false);
    },
    onError: () => {
      toast.error(t("productPage.editError"));
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async () =>
      apiFetch(`/farm-product/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("productPage.deleteSuccess"));
      navigate({ to: `/farm/${farmProduct.farmId}` });
    },
    onError: () => {
      toast.error(t("productPage.deleteError"));
    },
  });

  if (isLoading) return <p>{t("productPage.loading")}</p>;
  if (isError || !farmProduct)
    return <p className="text-red-500">{t("productPage.errorLoading")}</p>;

  const inner = farmProduct.product;
  const imageUrl = inner.images?.[0]?.url || "/placeholder.jpg";

  const categoryLabel = getCategoryLabel(inner.category, t);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">{inner.name}</h1>

      <div className="w-full h-64 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
        <img
          src={imageUrl}
          alt={inner.name}
          className="w-full h-full object-cover"
        />
      </div>

      {!editing ? (
        <div className="space-y-2">
          <p>
            <strong>{t("productPage.category")}:</strong> {categoryLabel}
          </p>
          <p>
            <strong>{t("productPage.price")}:</strong> {farmProduct.price} €
          </p>
          <p>
            <strong>{t("productPage.stock")}:</strong> {farmProduct.stock}
          </p>
          <p>
            <strong>{t("productPage.description")}:</strong>{" "}
            {inner.description || t("productPage.noDescription")}
          </p>

          <div className="flex gap-3 pt-4">
            <Button onClick={() => setEditing(true)}>
              {t("productPage.edit")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteProduct.mutate()}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending
                ? t("productPage.deleting")
                : t("productPage.delete")}
            </Button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={form.handleSubmit((data) => editProduct.mutate(data))}
          className="space-y-3"
        >
          <Input
            {...form.register("name")}
            placeholder={t("productPage.name")}
          />
          <Controller
            control={form.control}
            name="category"
            render={({ field }) => (
              <Select
                value={field.value ?? undefined}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("productPage.category")} />
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
          <Textarea
            {...form.register("description")}
            placeholder={t("productPage.description")}
          />
          <Input
            type="number"
            step="0.01"
            {...form.register("price", { valueAsNumber: true })}
            placeholder={t("productPage.price")}
          />
          <Input
            type="number"
            {...form.register("stock", { valueAsNumber: true })}
            placeholder={t("productPage.stock")}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(false)}
            >
              {t("productPage.cancel")}
            </Button>
            <Button type="submit" disabled={editProduct.isPending}>
              {editProduct.isPending
                ? t("productPage.saving")
                : t("productPage.save")}
            </Button>
          </div>
        </form>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">{t("reviews.title")}</h2>

        {inner.reviews?.length === 0 ? (
          <p className="text-gray-500">{t("reviews.none")}</p>
        ) : (
          <div className="space-y-4">
            {inner.reviews.map((r: any) => (
              <div key={r.id} className="border-b pb-2">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-500" />
                  <span className="font-medium">{r.rating}/5</span>
                  <span className="text-sm text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {r.comment && <p className="text-sm mt-1">{r.comment}</p>}
                <p className="text-xs text-gray-500">{r.user?.name}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
