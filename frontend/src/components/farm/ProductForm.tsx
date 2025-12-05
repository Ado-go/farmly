import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { PRODUCT_CATEGORIES } from "@/lib/productCategories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

const createProductSchema = (t: ReturnType<typeof useTranslation>["t"]) =>
  z.object({
    name: z.string().min(1, { message: t("product.validation.name") }),
    category: z.enum(PRODUCT_CATEGORIES),
    description: z.string().optional(),
    price: z.number().positive({ message: t("product.validation.pricePositive") }),
    stock: z.number().min(0, { message: t("product.validation.stockNonNegative") }),
  });
type ProductFormData = z.infer<ReturnType<typeof createProductSchema>>;

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
  const productSchema = useMemo(() => createProductSchema(t), [t]);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const inputTone =
    "bg-white/80 border-emerald-100 focus-visible:ring-emerald-200 focus:border-emerald-400";

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: undefined,
      description: "",
    } as Partial<ProductFormData>,
  });
  const errors = form.formState.errors;

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
      form.reset({
        name: "",
        category: undefined,
        description: "",
        price: undefined,
        stock: undefined,
      } as Partial<ProductFormData>);
      setImages([]);
      onClose();
      onSuccess();
    },
    onError: () => toast.error(t("farmPage.productAddError")),
  });

  return (
    <form
      onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
      className="space-y-5"
      noValidate
    >
      <div className="space-y-2">
        <FieldLabel className="text-sm font-medium">
          {t("product.uploadImage")}
        </FieldLabel>
        <ImageUploader
          value={images}
          onChange={setImages}
          editable
          height="h-48"
        />
      </div>

      <FieldSet className="grid grid-cols-1 gap-4">
        <Field>
          <FieldLabel htmlFor="name">{t("product.name")}</FieldLabel>
          <FieldContent>
            <Input
              id="name"
              className={inputTone}
              placeholder={t("product.name")}
              {...form.register("name")}
            />
            <FieldError errors={errors.name ? [errors.name] : undefined} />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>{t("product.category")}</FieldLabel>
          <FieldContent>
            <Controller
              control={form.control}
              name="category"
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value ?? undefined}
                >
                  <SelectTrigger className={inputTone}>
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
            <FieldError
              errors={errors.category ? [errors.category] : undefined}
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="description">
            {t("product.description")}
          </FieldLabel>
          <FieldContent>
            <Textarea
              id="description"
              className={inputTone}
              placeholder={t("product.description")}
              {...form.register("description")}
            />
            <FieldError
              errors={errors.description ? [errors.description] : undefined}
            />
          </FieldContent>
        </Field>

        <FieldSet className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="price">{t("product.price")}</FieldLabel>
            <FieldContent>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  €
                </span>
                <Input
                  id="price"
                  type="number"
                  className={cn(inputTone, "pl-7")}
                  placeholder={t("product.price")}
                  {...form.register("price", {
                    valueAsNumber: true,
                    setValueAs: (value) =>
                      value === "" || value === null ? undefined : Number(value),
                  })}
                />
              </div>
              <FieldError errors={errors.price ? [errors.price] : undefined} />
            </FieldContent>
          </Field>

          <Field>
            <FieldLabel htmlFor="stock" className="flex items-center gap-2">
              {t("product.stock")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t("product.stockTooltip")}</TooltipContent>
              </Tooltip>
            </FieldLabel>
            <FieldContent>
              <Input
                id="stock"
                type="number"
                className={inputTone}
                placeholder={t("product.stock")}
                {...form.register("stock", {
                  valueAsNumber: true,
                  setValueAs: (value) =>
                    value === "" || value === null ? undefined : Number(value),
                })}
              />
              <FieldError errors={errors.stock ? [errors.stock] : undefined} />
            </FieldContent>
          </Field>
        </FieldSet>
      </FieldSet>

      <div className="flex justify-end gap-2 pt-1">
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
