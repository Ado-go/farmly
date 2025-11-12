import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useEffect, useState } from "react";
import { ImageUploader, type UploadedImage } from "@/components/ImageUploader";
import { ImageCarousel } from "@/components/ImageCarousel";
import { apiFetch } from "@/lib/api";

const farmSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  city: z.string().min(2),
  street: z.string().min(2),
  region: z.string().min(2),
  postalCode: z.string().min(2),
  country: z.string().min(2),
});
export type FarmFormData = z.infer<typeof farmSchema>;

export function FarmHeader({
  farm,
  editing,
  setEditing,
  onEdit,
  onDelete,
  isDeleting,
  isSaving,
}: {
  farm: any;
  editing: boolean;
  setEditing: (v: boolean) => void;
  onEdit: (data: any) => void;
  onDelete: () => void;
  isDeleting: boolean;
  isSaving: boolean;
}) {
  const { t } = useTranslation();
  const form = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
    defaultValues: farm || {},
  });

  const [images, setImages] = useState<UploadedImage[]>([]);

  useEffect(() => {
    form.reset(farm || {});
    const imgs = (farm?.images ?? []).map((i: any) => ({
      url: i.optimizedUrl || i.url,
      publicId: i.publicId,
    }));
    setImages(imgs);
  }, [farm]);

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

  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">{farm.name}</h1>

      {!editing ? (
        images.length > 0 ? (
          <div className="mb-4">
            <ImageCarousel
              images={images}
              editable={false}
              height="h-64"
              emptyLabel={t("farmPage.noImage")}
            />
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded mb-4">
            <span className="text-gray-500">{t("farmPage.noImage")}</span>
          </div>
        )
      ) : null}

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
          onSubmit={form.handleSubmit(handleSave)}
          className="space-y-3 mt-3"
        >
          <ImageUploader
            value={images}
            onChange={setImages}
            editable
            height="h-64"
          />

          <Input {...form.register("name")} placeholder={t("farmPage.name")} />
          <Textarea
            {...form.register("description")}
            placeholder={t("farmPage.description")}
          />
          <Input {...form.register("city")} placeholder={t("farmPage.city")} />
          <Input
            {...form.register("street")}
            placeholder={t("farmPage.street")}
          />
          <Input
            {...form.register("region")}
            placeholder={t("farmPage.region")}
          />
          <Input
            {...form.register("postalCode")}
            placeholder={t("farmPage.postalCode")}
          />
          <Input
            {...form.register("country")}
            placeholder={t("farmPage.country")}
          />

          <div className="flex items-center gap-2 pt-2">
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

      {!editing && (
        <div className="flex items-center gap-2 mt-6">
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
  );
}
