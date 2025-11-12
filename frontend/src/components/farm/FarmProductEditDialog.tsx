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
import { ImageCarousel } from "@/components/ImageCarousel";

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

  const [images, setImages] = useState<any[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    if (product?.product?.images) {
      setImages(product.product.images);
      setNewFiles([]);
      setRemovedIds([]);
    }
  }, [product]);

  const updateProduct = useMutation({
    mutationFn: async () => {
      const uploaded: any[] = [];
      for (const file of newFiles) {
        const formData = new FormData();
        formData.append("image", file);
        const res = await apiFetch("/upload", {
          method: "POST",
          body: formData,
        });
        uploaded.push({ url: res.url, publicId: res.publicId });
      }

      const keptImages = images.filter(
        (img) => !removedIds.includes(img.publicId)
      );

      const allImages = [...keptImages, ...uploaded];

      const body = {
        name: product.product.name,
        category: product.product.category,
        description: product.product.description,
        price: product.price,
        stock: product.stock,
        images: allImages,
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

  const handleDeleteAt = (idx: number) => {
    const img = images[idx];
    setRemovedIds((prev) => [...prev, img.publicId]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleNewFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const list = Array.from(e.target.files);
    setNewFiles((prev) => [...prev, ...list]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("product.editTitle")}</DialogTitle>
        </DialogHeader>

        {product && (
          <div className="space-y-3">
            <ImageCarousel
              images={[
                ...images,
                ...newFiles.map((f) => ({ url: URL.createObjectURL(f) })),
              ]}
              onDelete={(i) => {
                if (i < images.length) handleDeleteAt(i);
                else
                  setNewFiles((prev) =>
                    prev.filter((_, idx) => idx !== i - images.length)
                  );
              }}
              editable
              height="h-56"
              emptyLabel={t("farmPage.noImage")}
            />

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleNewFiles}
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
              <Button
                variant="destructive"
                onClick={async () => {
                  await apiFetch(`/farm-product/${product.id}`, {
                    method: "DELETE",
                  });
                  toast.success(t("product.deleted"));
                  queryClient.invalidateQueries();
                  onOpenChange(false);
                  onSave();
                }}
              >
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
