import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { apiFetch } from "../../lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

const productSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
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
    data: product,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => await apiFetch(`/product/${id}`),
  });

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        category: product.category,
        description: product.description,
        price: product.price,
      });
    }
  }, [product, form]);

  const editProduct = useMutation({
    mutationFn: async (data: ProductFormData) =>
      apiFetch(`/product/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success(t("productPage.editSuccess"));
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      setEditing(false);
    },
    onError: () => {
      toast.error(t("productPage.editError"));
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async () => apiFetch(`/product/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("productPage.deleteSuccess"));
      navigate({ to: `/farm/${product.farmId}` });
    },
    onError: () => {
      toast.error(t("productPage.deleteError"));
    },
  });

  if (isLoading) return <p>{t("productPage.loading")}</p>;
  if (isError)
    return <p className="text-red-500">{t("productPage.errorLoading")}</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">{product.name}</h1>

      <div className="w-full h-64 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-500">{t("productPage.noImage")}</span>
        )}
      </div>

      {!editing ? (
        <div className="space-y-2">
          <p>
            <strong>{t("productPage.category")}:</strong> {product.category}
          </p>
          <p>
            <strong>{t("productPage.price")}:</strong> {product.price} €
          </p>
          <p>
            <strong>{t("productPage.description")}:</strong>{" "}
            {product.description || t("productPage.noDescription")}
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
          <Input
            {...form.register("category")}
            placeholder={t("productPage.category")}
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

        {product.reviews?.length === 0 ? (
          <p className="text-gray-500">{t("reviews.none")}</p>
        ) : (
          <div className="space-y-4">
            {product.reviews.map((r: any) => (
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
