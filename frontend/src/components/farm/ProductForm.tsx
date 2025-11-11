import { useForm } from "react-hook-form";
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      price: 0,
      stock: 0,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const uploaded: any[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("image", file);
        const res = await apiFetch("/upload", {
          method: "POST",
          body: formData,
        });
        uploaded.push(res);
      }

      return apiFetch("/farm-product", {
        method: "POST",
        body: {
          ...data,
          farmId,
          images: uploaded.map((u) => ({ url: u.url })),
        },
      });
    },
    onSuccess: () => {
      toast.success(t("farmPage.productAdded"));
      form.reset();
      setFiles([]);
      setPreviews([]);
      onClose();
      onSuccess();
    },
    onError: () => toast.error(t("farmPage.productAddError")),
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const f = Array.from(e.target.files);
    setFiles((p) => [...p, ...f]);
    setPreviews((p) => [...p, ...f.map((file) => URL.createObjectURL(file))]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <form
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      className="space-y-3"
    >
      {previews.length > 0 && (
        <Carousel>
          <CarouselContent>
            {previews.map((src, i) => (
              <CarouselItem key={i}>
                <div className="relative">
                  <img
                    src={src}
                    alt="preview"
                    className="h-48 w-full object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 bg-white/80 text-xs rounded px-1"
                  >
                    ✕
                  </button>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      )}

      <Input {...form.register("name")} placeholder={t("product.name")} />
      <Input
        {...form.register("category")}
        placeholder={t("product.category")}
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

      <input type="file" multiple accept="image/*" onChange={handleFiles} />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          {t("farmPage.cancel")}
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? t("farmPage.saving") : t("farmPage.add")}
        </Button>
      </div>
    </form>
  );
}
