import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { PRODUCT_CATEGORIES } from "@/lib/productCategories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FarmProduct } from "@/types/farm";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";
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
  productSchema,
  type ProductEditFormData as ProductFormData,
} from "@/schemas/productSchema";

export function FarmProductEditDialog({
  product,
  open,
  onOpenChange,
  onSave,
}: {
  product: FarmProduct | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: () => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const productSchemaDef = useMemo(() => productSchema, []);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const inputTone =
    "bg-white/80 border-emerald-100 focus-visible:ring-emerald-200 focus:border-emerald-400";
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchemaDef) as Resolver<ProductFormData>,
    defaultValues: {
      name: "",
      category: undefined,
      description: "",
      isAvailable: true,
    } as Partial<ProductFormData>,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (!product) {
      form.reset({
        name: "",
        category: undefined,
        description: "",
        price: undefined,
        stock: undefined,
        isAvailable: true,
      } as Partial<ProductFormData>);
      setImages([]);
      return;
    }

    setImages(product.product?.images ?? []);
    form.reset({
      name: product.product.name ?? "",
      category: (product.product.category ??
        undefined) as ProductFormData["category"],
      description: product.product.description ?? "",
      price: product.price,
      stock: product.stock,
      isAvailable: product.isAvailable ?? true,
    } as Partial<ProductFormData>);
  }, [product, form]);

  const updateProduct = useMutation({
    mutationFn: async (values: ProductFormData) => {
      if (!product) throw new Error("No product selected");

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

      const body = {
        name: values.name,
        category: values.category,
        description: values.description,
        price: values.price,
        stock: values.stock,
        isAvailable: values.isAvailable ?? true,
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
    if (!product) return;
    await apiFetch(`/farm-product/${product.id}`, { method: "DELETE" });
    toast.success(t("product.deleted"));
    queryClient.invalidateQueries();
    onOpenChange(false);
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("product.editTitle")}</DialogTitle>
        </DialogHeader>

        {product && (
          <form
            className="space-y-4 max-h-[70vh] overflow-y-auto pr-1"
            onSubmit={form.handleSubmit((values: ProductFormData) =>
              updateProduct.mutate(values)
            )}
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
                height="h-56"
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
                  <FieldError
                    errors={errors.name ? [errors.name] : undefined}
                  />
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
                    errors={
                      errors.description ? [errors.description] : undefined
                    }
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
                            value === "" || value === null
                              ? undefined
                              : Number(value),
                        })}
                      />
                    </div>
                    <FieldError
                      errors={errors.price ? [errors.price] : undefined}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="stock"
                  >
                    {t("product.stock")}
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
                          value === "" || value === null
                            ? undefined
                            : Number(value),
                      })}
                    />
                    <FieldError
                      errors={errors.stock ? [errors.stock] : undefined}
                    />
                  </FieldContent>
                </Field>
              </FieldSet>

              <Field>
                <FieldLabel htmlFor="isAvailable">
                  {t("product.availability")}
                </FieldLabel>
                <FieldContent>
                  <label className="flex items-center justify-between rounded-lg border border-emerald-100 bg-white/70 px-3 py-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-emerald-900">
                        {form.watch("isAvailable")
                          ? t("product.available")
                          : t("product.unavailable")}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("product.availabilityHelp")}
                      </span>
                    </div>
                    <input
                      id="isAvailable"
                      type="checkbox"
                      className="h-5 w-5 accent-emerald-600"
                      checked={form.watch("isAvailable") ?? true}
                      onChange={(e) => form.setValue("isAvailable", e.target.checked)}
                    />
                  </label>
                </FieldContent>
              </Field>
            </FieldSet>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" type="button">
                    {t("product.delete")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("product.confirmDeleteTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t("product.confirmDeleteText")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("farmPage.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteProduct}>
                      {t("product.delete")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button type="submit" disabled={updateProduct.isPending}>
                {updateProduct.isPending
                  ? t("farmPage.saving")
                  : t("product.save")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
