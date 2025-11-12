import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";

export function FarmProductEditDialog({
  product,
  open,
  onOpenChange,
  onSave,
}: {
  product: any;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [images, setImages] = useState<UploadedImage[]>([]);

  useEffect(() => {
    if (product?.product?.images) {
      setImages(product.product.images);
    } else {
      setImages([]);
    }
  }, [product]);

  const updateProduct = useMutation({
    mutationFn: async () => {
      const uploaded = [];
      for (const img of images) {
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

      const body = {
        name: product.product.name,
        category: product.product.category,
        description: product.product.description,
        price: product.price,
        stock: product.stock,
        images: uploaded.map((i) => ({ url: i.url, publicId: i.publicId })),
      };

      return apiFetch(`/farm-product/${product.id}`, { method: "PUT", body });
    },
    onSuccess: () => {
      toast.success(t("product.updated"));
      queryClient.invalidateQueries();
      onOpenChange(false);
      onSave();
    },
    onError: () => toast.error(t("farmPage.editError")),
  });

  const handleDeleteProduct = async () => {
    await apiFetch(`/farm-product/${product.id}`, { method: "DELETE" });
    toast.success(t("product.deleted"));
    queryClient.invalidateQueries();
    onOpenChange(false);
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("product.editTitle")}</DialogTitle>
        </DialogHeader>

        {product && (
          <div className="space-y-3">
            <ImageUploader
              value={images}
              onChange={setImages}
              editable
              height="h-56"
            />

            <Input
              defaultValue={product.product.name}
              onChange={(e) => (product.product.name = e.target.value)}
              placeholder={t("product.name")}
            />
            <Input
              defaultValue={product.product.category}
              onChange={(e) => (product.product.category = e.target.value)}
              placeholder={t("product.category")}
            />
            <Textarea
              defaultValue={product.product.description}
              onChange={(e) => (product.product.description = e.target.value)}
              placeholder={t("product.description")}
            />
            <Input
              type="number"
              defaultValue={product.price}
              onChange={(e) => (product.price = parseFloat(e.target.value))}
              placeholder={t("product.price")}
            />
            <Input
              type="number"
              defaultValue={product.stock}
              onChange={(e) => (product.stock = parseInt(e.target.value))}
              placeholder={t("product.stock")}
            />

            <div className="flex justify-between pt-4">
              <Button variant="destructive" onClick={handleDeleteProduct}>
                {t("product.delete")}
              </Button>

              <Button
                onClick={() => updateProduct.mutate()}
                disabled={updateProduct.isPending}
              >
                {updateProduct.isPending
                  ? t("farmPage.saving")
                  : t("product.save")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
