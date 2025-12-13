import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
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
import { useEffect, useMemo, useState } from "react";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { ImageCarousel } from "@/components/ImageCarousel";
import { apiFetch } from "@/lib/api";
import type { Farm, MediaImage } from "@/types/farm";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldSet,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGION_OPTIONS } from "@/constants/regions";
import { createFarmSchema, type FarmFormData } from "@/schemas/farmSchema";
export type { FarmFormData };

export function FarmHeader({
  farm,
  editing,
  setEditing,
  onEdit,
  onDelete,
  isDeleting,
  isSaving,
}: {
  farm: Farm;
  editing: boolean;
  setEditing: (v: boolean) => void;
  onEdit: (data: FarmFormData & { images: UploadedImage[] }) => void;
  onDelete: () => void;
  isDeleting: boolean;
  isSaving: boolean;
}) {
  const { t } = useTranslation();
  const farmSchema = useMemo(() => createFarmSchema(t), [t]);
  const form = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: farm?.name ?? "",
      description: farm?.description ?? "",
      city: farm?.city ?? "",
      street: farm?.street ?? "",
      region: farm?.region ?? "",
      postalCode: farm?.postalCode ?? "",
      country: farm?.country ?? "",
    },
  });

  const [images, setImages] = useState<UploadedImage[]>([]);
  const inputTone =
    "bg-white/80 border-emerald-100 focus-visible:ring-emerald-200 focus:border-emerald-400";

  useEffect(() => {
    form.reset({
      name: farm?.name ?? "",
      description: farm?.description ?? "",
      city: farm?.city ?? "",
      street: farm?.street ?? "",
      region: farm?.region ?? "",
      postalCode: farm?.postalCode ?? "",
      country: farm?.country ?? "",
    });
    const imgs = (farm?.images ?? []).map((i: MediaImage) => ({
      url: i.optimizedUrl || i.url,
      publicId: i.publicId,
    }));
    setImages(imgs);
  }, [farm, form]);

  const handleSave = async (data: FarmFormData) => {
    const uploaded: UploadedImage[] = [];

    for (const img of images) {
      if (img.file) {
        const fd = new FormData();
        fd.append("image", img.file);
        const res = await apiFetch("/upload", { method: "POST", body: fd });
        uploaded.push({
          url: res.url,
          publicId: res.publicId,
          optimizedUrl: res.optimizedUrl,
        });
      } else {
        uploaded.push({
          url: img.url,
          publicId: img.publicId,
          optimizedUrl: img.optimizedUrl,
        });
      }
    }

    onEdit({ ...data, images: uploaded });
  };

  const errors = form.formState.errors;

  return (
    <div className="rounded-3xl border border-emerald-100 bg-white shadow-sm p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
            {t("farmPage.manageLabel")}
          </p>
          <h1 className="text-4xl font-bold leading-tight">{farm.name}</h1>
          <p className="text-muted-foreground">
            {farm.street}, {farm.city}, {farm.region}, {farm.postalCode},{" "}
            {farm.country}
          </p>
        </div>

        {!editing && (
          <div className="flex items-center gap-2">
            <Button onClick={() => setEditing(true)} variant="default">
              {t("farmPage.editFarm")}
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  {isDeleting ? t("farmPage.deleting") : t("farmPage.delete")}
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
                    onClick={onDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {t("farmPage.delete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="mt-6 space-y-4">
          {images.length > 0 ? (
            <ImageCarousel
              images={images}
              editable={false}
              height="h-64"
              emptyLabel={t("farmPage.noImage")}
            />
          ) : (
            <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-xl border border-dashed border-emerald-200">
              <span className="text-gray-500">{t("farmPage.noImage")}</span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-50 bg-emerald-50/40 p-4">
              <p className="text-sm font-semibold text-emerald-900">
                {t("farmPage.description")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {farm.description || t("farmPage.noDescription")}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-50 bg-emerald-50/40 p-4">
              <p className="text-sm font-semibold text-emerald-900">
                {t("farmPage.addressLabel")}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {farm.street}, {farm.city}, {farm.region}, {farm.postalCode},{" "}
                {farm.country}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={form.handleSubmit(handleSave)}
          className="space-y-5 mt-6 max-h-[75vh] overflow-y-auto pr-1"
          noValidate
        >
          <div className="space-y-2">
            <FieldLabel className="text-sm font-medium">
              {t("farmPage.uploadImage")}
            </FieldLabel>
            <ImageUploader
              value={images}
              onChange={setImages}
              editable
              height="h-64"
            />
          </div>

          <FieldSet className="grid grid-cols-1 gap-4">
            <Field>
              <FieldLabel htmlFor="name">{t("farmPage.name")}</FieldLabel>
              <FieldContent>
                <Input
                  id="name"
                  className={inputTone}
                  placeholder={t("farmPage.name")}
                  {...form.register("name")}
                />
                <FieldError errors={errors.name ? [errors.name] : undefined} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="description">
                {t("farmPage.description")}
              </FieldLabel>
              <FieldContent>
                <Textarea
                  id="description"
                  className={inputTone}
                  placeholder={t("farmPage.description")}
                  {...form.register("description")}
                />
                <FieldError
                  errors={errors.description ? [errors.description] : undefined}
                />
              </FieldContent>
            </Field>

            <FieldSet className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="city">{t("farmPage.city")}</FieldLabel>
                <FieldContent>
                  <Input
                    id="city"
                    className={inputTone}
                    placeholder={t("farmPage.city")}
                    {...form.register("city")}
                  />
                  <FieldError
                    errors={errors.city ? [errors.city] : undefined}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="street">
                  {t("farmPage.street")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="street"
                    className={inputTone}
                    placeholder={t("farmPage.street")}
                    {...form.register("street")}
                  />
                  <FieldError
                    errors={errors.street ? [errors.street] : undefined}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="region">
                  {t("farmPage.region")}
                </FieldLabel>
                <FieldContent>
                  <Controller
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <Select
                        value={field.value || ""}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger
                          id="region"
                          className={`${inputTone} w-full`}
                          onBlur={field.onBlur}
                        >
                          <SelectValue placeholder={t("farmPage.region")} />
                        </SelectTrigger>
                        <SelectContent>
                          {REGION_OPTIONS.map((region) => (
                            <SelectItem key={region.value} value={region.value}>
                              {region.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError
                    errors={errors.region ? [errors.region] : undefined}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="postalCode">
                  {t("farmPage.postalCode")}
                </FieldLabel>
                <FieldContent>
                  <Input
                    id="postalCode"
                    className={inputTone}
                    placeholder={t("farmPage.postalCode")}
                    {...form.register("postalCode")}
                  />
                  <FieldError
                    errors={errors.postalCode ? [errors.postalCode] : undefined}
                  />
                </FieldContent>
              </Field>
            </FieldSet>

            <Field>
              <FieldLabel htmlFor="country">
                {t("farmPage.country")}
              </FieldLabel>
              <FieldContent>
                <Input
                  id="country"
                  className={inputTone}
                  placeholder={t("farmPage.country")}
                  {...form.register("country")}
                />
                <FieldError
                  errors={errors.country ? [errors.country] : undefined}
                />
              </FieldContent>
            </Field>
          </FieldSet>

          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("farmPage.saving") : t("farmPage.save")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(false)}
            >
              {t("farmPage.cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
