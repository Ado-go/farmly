import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { ImageCarousel } from "@/components/ImageCarousel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/offers/my/")({
  component: OffersMyPage,
});

const offerSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(2, "Category is required"),
  price: z.number().min(0, "Price must be 0 or more"),
  productName: z.string().min(2, "Product name is required"),
  productDescription: z.string().optional(),
  productCategory: z.string().min(2, "Product category is required"),
  productPrice: z.number().min(0, "Product price must be 0 or more"),
});

type OfferFormData = z.infer<typeof offerSchema>;

type Offer = {
  id: number;
  title: string;
  description?: string;
  category: string;
  price: number;
  product: {
    id: number;
    name: string;
    description?: string;
    category: string;
    basePrice?: number;
    images?: { url: string; publicId: string }[];
  };
};

function OffersMyPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);

  const {
    data: offers = [],
    isLoading,
    isError,
  } = useQuery<Offer[]>({
    queryKey: ["offersMy"],
    queryFn: async () => await apiFetch("/offer/my"),
  });

  const form = useForm<OfferFormData>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      price: 0,
      productName: "",
      productDescription: "",
      productCategory: "",
      productPrice: 0,
    },
  });

  useEffect(() => {
    if (editingOffer) {
      form.reset({
        title: editingOffer.title,
        description: editingOffer.description,
        category: editingOffer.category,
        price: editingOffer.price,
        productName: editingOffer.product?.name || "",
        productDescription: editingOffer.product?.description || "",
        productCategory: editingOffer.product?.category || "",
        productPrice: editingOffer.product?.basePrice ?? editingOffer.price,
      });
      setImages(
        (editingOffer.product?.images ?? []).map((img) => ({
          url: img.url,
          publicId: img.publicId,
        }))
      );
    } else {
      form.reset({
        title: "",
        description: "",
        category: "",
        price: 0,
        productName: "",
        productDescription: "",
        productCategory: "",
        productPrice: 0,
      });
      setImages([]);
    }
  }, [editingOffer, form]);

  const uploadImages = async (currentImages: UploadedImage[]) => {
    const uploaded: UploadedImage[] = [];
    for (const img of currentImages) {
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
    return uploaded;
  };

  const createOffer = useMutation({
    mutationFn: async (data: OfferFormData) => {
      const uploaded = await uploadImages(images);
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        price: Number(data.price),
        product: {
          name: data.productName,
          category: data.productCategory,
          description: data.productDescription,
          basePrice: Number(data.productPrice),
          images: uploaded
            .filter((img) => img.url && img.publicId)
            .map((img) => ({
              url: img.url,
              publicId: img.publicId as string,
            })),
        },
      };
      return apiFetch("/offer", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(t("offersPage.created"));
      queryClient.invalidateQueries({ queryKey: ["offersMy"] });
      setOpen(false);
      setEditingOffer(null);
      form.reset();
      setImages([]);
    },
    onError: () => {
      toast.error(t("offersPage.createError"));
    },
  });

  const updateOffer = useMutation({
    mutationFn: async (data: OfferFormData) => {
      if (!editingOffer) return;
      const uploaded = await uploadImages(images);
      const payload = {
        title: data.title,
        description: data.description,
        category: data.category,
        price: Number(data.price),
        product: {
          name: data.productName,
          category: data.productCategory,
          description: data.productDescription,
          basePrice: Number(data.productPrice),
          images: uploaded
            .filter((img) => img.url && img.publicId)
            .map((img) => ({
              url: img.url,
              publicId: img.publicId as string,
            })),
        },
      };
      return apiFetch(`/offer/${editingOffer.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(t("offersPage.updated"));
      queryClient.invalidateQueries({ queryKey: ["offersMy"] });
      setOpen(false);
      setEditingOffer(null);
      setTimeout(() => form.reset(), 150);
      setImages([]);
    },
    onError: () => {
      toast.error(t("offersPage.updateError"));
    },
  });

  const deleteOffer = useMutation({
    mutationFn: async (id: number) =>
      await apiFetch(`/offer/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("offersPage.deleted"));
      queryClient.invalidateQueries({ queryKey: ["offersMy"] });
    },
    onError: () => {
      toast.error(t("offersPage.deleteError"));
    },
  });

  const handleOpenCreate = () => {
    setEditingOffer(null);
    setImages([]);
    form.reset();
    setOpen(true);
  };

  if (isLoading)
    return <div className="text-center py-10">{t("offersPage.loading")}</div>;
  if (isError)
    return (
      <div className="text-red-500 text-center py-10">
        {t("offersPage.errorLoading")}
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{t("offersPage.myTitle")}</h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              {t("offersPage.createButton")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingOffer
                  ? t("offersPage.editTitle")
                  : t("offersPage.createTitle")}
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit((data) =>
                editingOffer
                  ? updateOffer.mutate(data)
                  : createOffer.mutate(data)
              )}
              className="space-y-4"
            >
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  {t("offersPage.offerDetails")}
                </h4>
                <Input
                  {...form.register("title")}
                  placeholder={t("offersPage.titleLabel")}
                />
                <Textarea
                  {...form.register("description")}
                  placeholder={t("offersPage.descriptionLabel")}
                />
                <Input
                  {...form.register("category")}
                  placeholder={t("offersPage.categoryLabel")}
                />
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("price", { valueAsNumber: true })}
                  placeholder={t("offersPage.priceLabel")}
                />
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-semibold text-gray-700">
                  {t("offersPage.productDetails")}
                </h4>
                <div>
                  <label className="block text-sm text-gray-600 mb-2">
                    {t("offersPage.productImagesLabel")}
                  </label>
                  <ImageUploader
                    value={images}
                    onChange={setImages}
                    editable
                    height="h-40"
                  />
                </div>
                <Input
                  {...form.register("productName")}
                  placeholder={t("offersPage.productNameLabel")}
                />
                <Textarea
                  {...form.register("productDescription")}
                  placeholder={t("offersPage.productDescriptionLabel")}
                />
                <Input
                  {...form.register("productCategory")}
                  placeholder={t("offersPage.productCategoryLabel")}
                />
                <Input
                  type="number"
                  step="0.01"
                  {...form.register("productPrice", { valueAsNumber: true })}
                  placeholder={t("offersPage.productPriceLabel")}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setOpen(false)}
                >
                  {t("offersPage.cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={createOffer.isPending || updateOffer.isPending}
                >
                  {createOffer.isPending || updateOffer.isPending
                    ? t("offersPage.saving")
                    : editingOffer
                      ? t("offersPage.update")
                      : t("offersPage.create")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {offers.length === 0 ? (
        <p className="text-gray-500">{t("offersPage.noOffers")}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="p-4 space-y-2">
              <h3 className="font-semibold">{offer.title}</h3>
              <ImageCarousel
                images={offer.product?.images ?? []}
                height="h-32"
                emptyLabel={t("offersPage.noImage")}
              />
              <p className="text-sm text-gray-600">{offer.price} €</p>
              <p className="text-xs text-gray-500">{offer.category}</p>

              <div className="flex gap-2 mt-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setEditingOffer(offer);
                    setOpen(true);
                  }}
                >
                  {t("offersPage.edit")}
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      disabled={deleteOffer.isPending}
                    >
                      {deleteOffer.isPending
                        ? t("offersPage.deleting")
                        : t("offersPage.delete")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        {t("offersPage.confirmDeleteTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("offersPage.confirmDeleteText")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        {t("offersPage.cancel")}
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteOffer.mutate(offer.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {t("offersPage.delete")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
