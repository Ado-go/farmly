import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../lib/api";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import type { Farm } from "@/types/farm";
import {
  Field,
  FieldContent,
  FieldDescription,
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
import { createFarmSchema, type FarmFormData } from "@/schemas/farmSchema";
import { REGION_OPTIONS } from "@/constants/regions";

export const Route = createFileRoute("/farm/")({
  component: FarmPage,
});

function FarmPage() {
  const { t } = useTranslation();
  const farmSchema = useMemo(() => createFarmSchema(t), [t]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const inputTone =
    "bg-white/80 border-emerald-100 focus-visible:ring-emerald-200 focus:border-emerald-400";

  const form = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      name: "",
      description: "",
      city: "",
      street: "",
      region: "",
      postalCode: "",
      country: "",
    },
  });

  const {
    data: farms = [],
    isLoading,
    isError,
  } = useQuery<Farm[]>({
    queryKey: ["farms"],
    queryFn: async () => apiFetch("/farm"),
  });

  const createFarm = useMutation({
    mutationFn: async (data: FarmFormData) => {
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

      return apiFetch("/farm", {
        method: "POST",
        body: { ...data, images: uploaded },
      });
    },
    onSuccess: () => {
      form.reset();
      setImages([]);
      setOpen(false);
      toast.success(t("farmPage.farmCreated"));
      queryClient.invalidateQueries({ queryKey: ["farms"] });
    },
    onError: () => {
      toast.error(t("farmPage.errorCreating"));
    },
  });

  const onSubmit = (data: FarmFormData) => createFarm.mutate(data);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64 text-gray-500">
        {t("farmPage.loading")}
      </div>
    );

  if (isError)
    return (
      <div className="text-red-500 text-center mt-10">
        {t("farmPage.errorLoading")}
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-emerald-50 via-white to-lime-50 p-6 shadow-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,197,94,0.08),transparent_38%),radial-gradient(circle_at_85%_10%,rgba(251,191,36,0.1),transparent_32%)]" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
              {t("farmPage.manageLabel")}
            </p>
            <h2 className="text-3xl font-semibold">{t("farmPage.title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("farmPage.subtitle")}
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-sm" variant="default">
                {t("farmPage.addFarm")}
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto sm:max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="space-y-1">
                <span className="block text-xs uppercase tracking-[0.28em] text-emerald-700">
                  {t("farmPage.manageLabel")}
                </span>
                  <span className="text-2xl font-semibold">
                    {t("farmPage.newFarm")}
                  </span>
                  <p className="text-sm text-muted-foreground font-normal">
                    {t("farmPage.createSubtitle")}
                  </p>
                </DialogTitle>
              </DialogHeader>

              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
                noValidate
              >
                <div className="space-y-2">
                  <FieldLabel className="text-sm font-medium">
                    {t("farmPage.uploadImage")}
                  </FieldLabel>
                  <FieldDescription className="text-muted-foreground">
                    {t("farmPage.imagesHelper")}
                  </FieldDescription>
                  <ImageUploader
                    value={images}
                    onChange={setImages}
                    editable
                    height="h-56"
                  />
                </div>

                <FieldSet className="grid grid-cols-1 gap-4">
                  <Field>
                    <FieldLabel htmlFor="name">{t("farmPage.name")}</FieldLabel>
                    <FieldContent>
                      <Input
                        id="name"
                        placeholder={t("farmPage.name")}
                        className={inputTone}
                        {...form.register("name")}
                      />
                      <FieldError
                        errors={
                          form.formState.errors.name
                            ? [form.formState.errors.name]
                            : undefined
                        }
                      />
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="description">
                      {t("farmPage.description")}
                    </FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="description"
                        placeholder={t("farmPage.description")}
                        className={inputTone}
                        {...form.register("description")}
                      />
                      <FieldError
                        errors={
                          form.formState.errors.description
                            ? [form.formState.errors.description]
                            : undefined
                        }
                      />
                    </FieldContent>
                  </Field>

                  <FieldSet className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="city">
                        {t("farmPage.city")}
                      </FieldLabel>
                      <FieldContent>
                        <Input
                          id="city"
                          placeholder={t("farmPage.city")}
                          className={inputTone}
                          {...form.register("city")}
                        />
                        <FieldError
                          errors={
                            form.formState.errors.city
                              ? [form.formState.errors.city]
                              : undefined
                          }
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
                          placeholder={t("farmPage.street")}
                          className={inputTone}
                          {...form.register("street")}
                        />
                        <FieldError
                          errors={
                            form.formState.errors.street
                              ? [form.formState.errors.street]
                              : undefined
                          }
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
                                <SelectValue
                                  placeholder={t("farmPage.region")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {REGION_OPTIONS.map((region) => (
                                  <SelectItem
                                    key={region.value}
                                    value={region.value}
                                  >
                                    {region.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <FieldError
                          errors={
                            form.formState.errors.region
                              ? [form.formState.errors.region]
                              : undefined
                          }
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
                          placeholder={t("farmPage.postalCode")}
                          className={inputTone}
                          {...form.register("postalCode")}
                        />
                        <FieldError
                          errors={
                            form.formState.errors.postalCode
                              ? [form.formState.errors.postalCode]
                              : undefined
                          }
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
                        placeholder={t("farmPage.country")}
                        className={inputTone}
                        {...form.register("country")}
                      />
                      <FieldError
                        errors={
                          form.formState.errors.country
                            ? [form.formState.errors.country]
                            : undefined
                        }
                      />
                    </FieldContent>
                  </Field>
                </FieldSet>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={createFarm.isPending}
                >
                  {createFarm.isPending
                    ? t("farmPage.creating")
                    : t("farmPage.create")}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {farms.length === 0 ? (
        <p className="text-gray-500">{t("farmPage.noFarms")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => {
            const imageUrl =
              farm.images?.[0]?.optimizedUrl || farm.images?.[0]?.url;
            return (
              <Card
                key={farm.id}
                className="group relative overflow-hidden cursor-pointer rounded-2xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/30 to-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                onClick={() =>
                  navigate({ to: "/farm/$id", params: { id: String(farm.id) } })
                }
              >
                <div className="relative h-40 w-full overflow-hidden">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={farm.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full bg-gray-100 flex items-center justify-center text-gray-500">
                      {t("farmPage.noImage")}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur">
                    {farm.city || farm.region || t("farmPage.addressLabel")}
                  </div>
                </div>
                <CardContent className="p-4">
                  <CardTitle className="text-xl font-semibold mb-1 text-emerald-900">
                    {farm.name}
                  </CardTitle>
                  <p className="text-gray-700 text-sm line-clamp-2">
                    {farm.description || t("farmPage.noDescription")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
