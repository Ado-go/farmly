import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { FarmHeader } from "@/components/farm/FarmHeader";
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

export const Route = createFileRoute("/farm/$id")({
  component: FarmDetailPage,
});

function FarmDetailPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Queries
  const {
    data: farm,
    isLoading: farmLoading,
    isError: farmError,
  } = useQuery({
    queryKey: ["farm", id],
    queryFn: async () => await apiFetch(`/farm/${id}`),
  });

  const {
    data: farmProducts = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery({
    queryKey: ["farmProducts", id],
    queryFn: async () => await apiFetch(`/farm-product/farm/${id}`),
  });

  // Mutations
  const editFarm = useMutation({
    mutationFn: (data: any) =>
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
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <FarmHeader
        farm={farm}
        editing={editing}
        setEditing={setEditing}
        onEdit={(data) => editFarm.mutate(data)}
        onDelete={() => deleteFarm.mutate()}
        isDeleting={deleteFarm.isPending}
        isSaving={editFarm.isPending}
      />

      <div className="flex justify-between items-center mt-8">
        <h2 className="text-2xl font-semibold">{t("farmPage.products")}</h2>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button>{t("farmPage.addProduct")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
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
        <p className="text-gray-500">{t("farmPage.noProducts")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {farmProducts.map((fp: any) => (
            <div
              key={fp.id}
              className="p-3 border rounded cursor-pointer hover:bg-emerald-50"
              onClick={() => {
                setSelectedProduct(fp);
                setShowEdit(true);
              }}
            >
              {fp.product.images?.[0] ? (
                <img
                  src={fp.product.images[0].url}
                  alt={fp.product.name}
                  className="h-32 w-full object-cover rounded mb-2"
                />
              ) : (
                <div className="h-32 w-full bg-gray-200 text-gray-500 flex items-center justify-center rounded mb-2">
                  {t("farmPage.noImage")}
                </div>
              )}
              <h3 className="font-semibold">{fp.product.name}</h3>
              <p className="text-sm">{fp.price} €</p>
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
