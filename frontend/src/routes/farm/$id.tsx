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

const farmProductSchema = z.object({
  name: z.string().min(2, "Názov je povinný"),
  category: z.string().min(2, "Kategória je povinná"),
  description: z.string().optional(),
  price: z.number().min(0, "Cena musí byť väčšia alebo rovná 0"),
  stock: z.number().min(0, "Počet kusov musí byť 0 alebo viac"),
});

type FarmFormData = z.infer<typeof farmSchema>;
type FarmProductFormData = z.infer<typeof farmProductSchema>;

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

  const {
    data: farm,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["farm", id],
    queryFn: async () => await apiFetch(`/farm/${id}`),
  });

  const {
    data: farmProducts = [],
    isLoading: loadingProducts,
    isError: productsError,
  } = useQuery({
    queryKey: ["farmProducts", id],
    queryFn: async () => await apiFetch(`/farm-product/farm/${id}`),
  });

  const farmForm = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
    defaultValues: farm || {},
  });

  const productForm = useForm<FarmProductFormData>({
    resolver: zodResolver(farmProductSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      price: 0,
      stock: 0,
    },
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

  const addFarmProduct = useMutation({
    mutationFn: async (data: FarmProductFormData) => {
      const payload = {
        name: data.name,
        category: data.category,
        description: data.description,
        price: data.price,
        stock: data.stock,
        farmId: Number(id),
      };

      return apiFetch(`/farm-product`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(t("farmPage.productAdded"));
      queryClient.invalidateQueries({ queryKey: ["farmProducts", id] });
      productForm.reset();
      setShowProductForm(false);
    },
    onError: (err: any) => {
      console.error(err);
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

  const imageUrl = farm.images?.[0]?.url;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-4xl font-bold">{farm.name}</h1>

      <div className="w-full h-64 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
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
                addFarmProduct.mutate(data)
              )}
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
              <Input
                type="number"
                {...productForm.register("stock", { valueAsNumber: true })}
                placeholder={t("product.stock")}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProductForm(false)}
                >
                  {t("farmPage.cancel")}
                </Button>
                <Button type="submit" disabled={addFarmProduct.isPending}>
                  {addFarmProduct.isPending
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
        ) : productsError ? (
          <p className="text-red-500">{t("farmPage.errorLoadingProducts")}</p>
        ) : farmProducts.length === 0 ? (
          <p>{t("farmPage.noProducts")}</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {farmProducts.map((fp: any) => (
              <li
                key={fp.id}
                className="p-4 border rounded-md cursor-pointer hover:bg-emerald-50"
                onClick={() => navigate({ to: `/product/${fp.id}` })}
              >
                <h3 className="font-semibold">{fp.product.name}</h3>
                <p className="text-sm text-gray-600">{fp.product.category}</p>
                <p className="text-sm font-medium">{fp.price} €</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
