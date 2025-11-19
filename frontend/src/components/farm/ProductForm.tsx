import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import {
  PRODUCT_CATEGORIES,
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
  name: z.string().min(1),
  category: productCategorySchema,
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().nonnegative().default(0),
});
type ProductFormData = z.infer<typeof productSchema>;

export function ProductForm({
  farmId,
  onClose,
  onSuccess,
}: {
  farmId: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { t } = useTranslation();
  const [images, setImages] = useState<UploadedImage[]>([]);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: undefined,
      description: "",
      price: 0,
      stock: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const uploaded: UploadedImage[] = [];
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

      return apiFetch("/farm-product", {
        method: "POST",
        body: {
          ...data,
          farmId,
          images: uploaded.map((u) => ({ url: u.url, publicId: u.publicId })),
        },
      });
    },
    onSuccess: () => {
      toast.success(t("farmPage.productAdded"));
      form.reset();
      setImages([]);
      onClose();
      onSuccess();
    },
    onError: () => toast.error(t("farmPage.productAddError")),
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      className="space-y-3"
    >
      <ImageUploader
        value={images}
        onChange={setImages}
        editable
        height="h-48"
      />

      <Input {...form.register("name")} placeholder={t("product.name")} />
      <Controller
        control={form.control}
        name="category"
        render={({ field }) => (
          <Select
            onValueChange={field.onChange}
            value={field.value ?? undefined}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("product.category")} />
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
        placeholder={t("product.description")}
      />
      <Input
        type="number"
        {...form.register("price", { valueAsNumber: true })}
        placeholder={t("product.price")}
      />
      <Input
        type="number"
        {...form.register("stock", { valueAsNumber: true })}
        placeholder={t("product.stock")}
      />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          {t("farmPage.cancel")}
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t("farmPage.saving") : t("product.add")}
        </Button>
      </div>
    </form>
  );
}
