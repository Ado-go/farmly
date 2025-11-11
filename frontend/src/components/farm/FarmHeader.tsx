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

const farmSchema = z.object({
  name: z.string().min(2, "Názov je povinný"),
  description: z.string().optional(),
  city: z.string().min(2, "Mesto je povinné"),
  street: z.string().min(2, "Ulica je povinná"),
  region: z.string().min(2, "Región je povinný"),
  postalCode: z.string().min(2, "PSČ je povinné"),
  country: z.string().min(2, "Krajina je povinná"),
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
  onEdit: (data: FarmFormData) => void;
  onDelete: () => void;
  isDeleting: boolean;
  isSaving: boolean;
}) {
  const { t } = useTranslation();
  const form = useForm<FarmFormData>({
    resolver: zodResolver(farmSchema),
    defaultValues: farm || {},
  });

  const imageUrl = farm.images?.[0]?.url;

  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">{farm.name}</h1>

      <div className="w-full h-64 bg-gray-200 rounded-md overflow-hidden flex items-center justify-center mb-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={farm.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-gray-500">{t("farmPage.noImage")}</span>
        )}
      </div>

      {!editing ? (
        <div className="space-y-2">
          <p>{farm.description || t("farmPage.noDescription")}</p>
          <p>
            {farm.street}, {farm.city}, {farm.region}, {farm.postalCode},{" "}
            {farm.country}
          </p>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onEdit)} className="space-y-3 mt-3">
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

          <Button type="submit" disabled={isSaving}>
            {isSaving ? t("farmPage.saving") : t("farmPage.save")}
          </Button>
        </form>
      )}

      <div className="flex gap-2 mt-4">
        <Button onClick={() => setEditing(!editing)}>
          {editing ? t("farmPage.cancel") : t("farmPage.editFarm")}
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
    </div>
  );
}
