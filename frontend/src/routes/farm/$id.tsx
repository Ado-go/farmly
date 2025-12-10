import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { FarmHeader, type FarmFormData } from "@/components/farm/FarmHeader";
import { FarmProductEditDialog } from "@/components/farm/FarmProductEditDialog";
import { ProductForm } from "@/components/farm/ProductForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Farm, FarmProduct } from "@/types/farm";
import type { UploadedImage } from "@/components/ImageUploader";

export const Route = createFileRoute("/farm/$id")({
  component: FarmDetailPage,
});

function FarmDetailPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<FarmProduct | null>(
    null
  );
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Queries
  const {
    data: farm,
    isLoading: farmLoading,
    isError: farmError,
  } = useQuery<Farm>({
    queryKey: ["farm", id],
    queryFn: async () => await apiFetch(`/farm/${id}`),
  });

  const {
    data: farmProducts = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery<FarmProduct[]>({
    queryKey: ["farmProducts", id],
    queryFn: async () => await apiFetch(`/farm-product/farm/${id}`),
  });

  // Mutations
  const editFarm = useMutation({
    mutationFn: (data: FarmFormData & { images: UploadedImage[] }) =>
      apiFetch(`/farm/${id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      toast.success(t("farmPage.editSuccess"));
      queryClient.invalidateQueries({ queryKey: ["farm", id] });
      setEditing(false);
    },
  });

  const deleteFarm = useMutation({
    mutationFn: () => apiFetch(`/farm/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("farmPage.deleteSuccess"));
      navigate({ to: "/farm" });
    },
  });

  if (farmLoading || productsLoading)
    return (
      <div className="text-center text-gray-600 py-10">
        {t("farmPage.loading")}
      </div>
    );

  if (farmError || !farm)
    return (
      <div className="text-center text-red-600 py-10">
        {t("farmPage.errorLoading")}
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <FarmHeader
        farm={farm}
        editing={editing}
        setEditing={setEditing}
        onEdit={(data) => editFarm.mutate(data)}
        onDelete={() => deleteFarm.mutate()}
        isDeleting={deleteFarm.isPending}
        isSaving={editFarm.isPending}
      />

      <div className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            {t("farmPage.manageLabel")}
          </p>
          <h2 className="text-2xl font-semibold">{t("farmPage.products")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("farmPage.productsSubtitle")}
          </p>
        </div>

        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="shadow-sm">{t("farmPage.addProduct")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("farmPage.addProductTitle")}</DialogTitle>
            </DialogHeader>

            <ProductForm
              farmId={Number(id)}
              onClose={() => setShowAdd(false)}
              onSuccess={() =>
                queryClient.invalidateQueries({
                  queryKey: ["farmProducts", id],
                })
              }
            />
          </DialogContent>
        </Dialog>
      </div>

      {productsError ? (
        <p className="text-red-500">{t("farmPage.errorLoadingProducts")}</p>
      ) : farmProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center text-muted-foreground">
          {t("farmPage.noProducts")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {farmProducts.map((fp) => (
            <div
              key={fp.id}
              className="group rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/30 to-white p-4 shadow-sm cursor-pointer transition hover:-translate-y-1 hover:shadow-md"
              onClick={() => {
                setSelectedProduct(fp);
                setShowEdit(true);
              }}
            >
              <div className="relative mb-3 overflow-hidden rounded-xl border border-emerald-50">
                {fp.product.images?.[0] ? (
                  <img
                    src={fp.product.images[0].url}
                    alt={fp.product.name}
                    className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-32 w-full bg-gray-100 text-gray-500 flex items-center justify-center">
                    {t("farmPage.noImage")}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
                {fp.isAvailable === false && (
                  <div className="absolute left-2 top-2 rounded-full bg-red-500/90 px-3 py-1 text-xs font-semibold text-white shadow">
                    {t("product.unavailable")}
                  </div>
                )}
                <div className="absolute bottom-2 right-2 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-emerald-700 shadow-sm backdrop-blur">
                  {fp.price} €
                </div>
              </div>
              <h3 className="font-semibold text-lg text-emerald-900">
                {fp.product.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {fp.product.description ||
                  t(`productCategories.${fp.product.category}`, {
                    defaultValue: fp.product.category,
                  })}
              </p>
              <div className="flex items-center justify-between pt-3 text-sm">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                  {t("product.stock")}: {fp.stock}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100/70 px-3 py-1 text-xs font-semibold text-emerald-900">
                  {t(`productCategories.${fp.product.category}`, {
                    defaultValue: fp.product.category,
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <FarmProductEditDialog
        open={showEdit}
        onOpenChange={setShowEdit}
        product={selectedProduct}
        onSave={() =>
          queryClient.invalidateQueries({ queryKey: ["farmProducts", id] })
        }
      />
    </div>
  );
}
