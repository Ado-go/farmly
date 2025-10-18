import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../lib/api";
import { useState } from "react";
import { toast } from "sonner";
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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const farmSchema = z.object({
  name: z.string().min(2, "Názov je povinný"),
  description: z.string().optional(),
  city: z.string().min(2, "Mesto je povinné"),
  street: z.string().min(2, "Ulica je povinná"),
  region: z.string().min(2, "Región je povinný"),
  postalCode: z.string().min(2, "PSČ je povinné"),
  country: z.string().min(2, "Krajina je povinná"),
});

const productSchema = z.object({
  name: z.string().min(2, "Názov je povinný"),
  category: z.string().min(2, "Kategória je povinná"),
  description: z.string().optional(),
  price: z.number().min(0, "Cena musí byť väčšia alebo rovná 0"),
});

type ProductFormData = z.infer<typeof productSchema>;
type FarmFormData = z.infer<typeof farmSchema>;

export const Route = createFileRoute("/farm/$id")({
  component: FarmDetailPage,
});

function FarmDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);

  // FARM
  const {
    data: farm,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["farm", id],
    queryFn: async () => await apiFetch(`/farm/${id}`),
  });

  const farmForm = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
    defaultValues: farm || {},
  });

  const editFarm = useMutation({
    mutationFn: async (data: FarmFormData) =>
      apiFetch(`/farm/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      toast.success(t("farmPage.editSuccess"));
      queryClient.invalidateQueries({ queryKey: ["farm", id] });
      setEditing(false);
    },
    onError: () => {
      toast.error(t("farmPage.editError"));
    },
  });

  const deleteFarm = useMutation({
    mutationFn: async () => apiFetch(`/farm/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("farmPage.deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["farm"] });
      navigate({ to: "/farm" });
    },
    onError: () => {
      toast.error(t("farmPage.deleteError"));
    },
  });

  // PRODUCT
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products", id],
    queryFn: async () => await apiFetch(`/product/farm/${id}`),
  });

  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

  const addProduct = useMutation({
    mutationFn: async (data: ProductFormData) =>
      apiFetch(`/product`, {
        method: "POST",
        body: JSON.stringify({ ...data, farmId: Number(id) }),
      }),
    onSuccess: () => {
      toast.success(t("farmPage.productAdded"));
      queryClient.invalidateQueries({ queryKey: ["products", id] });
      setShowProductForm(false);
    },
    onError: () => {
      toast.error(t("farmPage.productAddError"));
    },
  });

  if (isLoading)
    return <div className="text-center py-10">{t("farmPage.loading")}</div>;
  if (isError)
    return (
      <div className="text-red-500 text-center py-10">
        {t("farmPage.errorLoading")}
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-bold">{farm.name}</h1>

      <div className="w-full h-64 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center">
        {farm.imageUrl ? (
          <img
            src={farm.imageUrl}
            alt={farm.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-500">{t("farmPage.noImage")}</span>
        )}
      </div>

      {!editing ? (
        <div className="space-y-2">
          <p>{farm.description || t("farmPage.noDescription")}</p>
          <p>
            {farm.street}, {farm.city}, {farm.region}, {farm.postalCode},{" "}
            {farm.country}
          </p>
        </div>
      ) : (
        <form
          onSubmit={farmForm.handleSubmit((data) => editFarm.mutate(data))}
          className="space-y-3"
        >
          <Input
            {...farmForm.register("name")}
            placeholder={t("farmPage.name")}
          />
          {farmForm.formState.errors.name && (
            <p className="text-red-500 text-sm">
              {farmForm.formState.errors.name.message}
            </p>
          )}
          <Textarea
            {...farmForm.register("description")}
            placeholder={t("farmPage.description")}
          />
          <Input
            {...farmForm.register("city")}
            placeholder={t("farmPage.city")}
          />
          <Input
            {...farmForm.register("street")}
            placeholder={t("farmPage.street")}
          />
          <Input
            {...farmForm.register("region")}
            placeholder={t("farmPage.region")}
          />
          <Input
            {...farmForm.register("postalCode")}
            placeholder={t("farmPage.postalCode")}
          />
          <Input
            {...farmForm.register("country")}
            placeholder={t("farmPage.country")}
          />

          <Button type="submit" disabled={editFarm.isPending}>
            {editFarm.isPending ? t("farmPage.saving") : t("farmPage.save")}
          </Button>

          <div className="mt-4">
            <label className="flex flex-col items-center justify-center p-3 border border-emerald-700 rounded-md cursor-pointer hover:bg-emerald-50 focus-within:ring-2 focus-within:ring-emerald-400">
              <span className="font-medium text-emerald-700">
                {t("farmPage.uploadImage")}
              </span>
              <input
                type="file"
                className="mt-2"
                onChange={() => console.log("upload image todo")}
                tabIndex={0}
              />
            </label>
          </div>
        </form>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => {
            setEditing(!editing);
            farmForm.reset(farm);
          }}
        >
          {editing ? t("farmPage.cancel") : t("farmPage.editFarm")}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleteFarm.isPending}>
              {deleteFarm.isPending
                ? t("farmPage.deleting")
                : t("farmPage.delete")}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("farmPage.confirmDeleteTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("farmPage.confirmDeleteText")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("farmPage.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteFarm.mutate()}
                className="bg-red-600 hover:bg-red-700"
              >
                {t("farmPage.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
          <DialogTrigger asChild>
            <Button>{t("farmPage.addProduct")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("farmPage.addProductTitle")}</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={productForm.handleSubmit((data) =>
                addProduct.mutate(data)
              )}
              className="space-y-3"
            >
              <Input
                {...productForm.register("name")}
                placeholder={t("product.name")}
              />
              <Input
                {...productForm.register("category")}
                placeholder={t("product.category")}
              />
              <Textarea
                {...productForm.register("description")}
                placeholder={t("product.description")}
              />
              <Input
                type="number"
                step="0.01"
                {...productForm.register("price", { valueAsNumber: true })}
                placeholder={t("product.price")}
              />

              <div className="mt-3">
                <label className="flex flex-col items-center justify-center p-3 border border-emerald-700 rounded-md cursor-pointer hover:bg-emerald-50 focus-within:ring-2 focus-within:ring-emerald-400">
                  <span className="font-medium text-emerald-700">
                    {t("product.uploadImage")}
                  </span>
                  <input
                    type="file"
                    className="mt-2"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        console.log("todo: upload image", file);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProductForm(false)}
                >
                  {t("farmPage.cancel")}
                </Button>
                <Button type="submit" disabled={addProduct.isPending}>
                  {addProduct.isPending
                    ? t("product.saving")
                    : t("product.add")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">
          {t("farmPage.products")}
        </h2>

        {loadingProducts ? (
          <p>{t("farmPage.loadingProducts")}</p>
        ) : products.length === 0 ? (
          <p>{t("farmPage.noProducts")}</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((product) => (
              <li
                key={product.id}
                className="p-4 border rounded-md cursor-pointer hover:bg-emerald-50"
                onClick={() => navigate({ to: `/product/${product.id}` })}
              >
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600">{product.category}</p>
                <p className="text-sm font-medium">{product.price} €</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
