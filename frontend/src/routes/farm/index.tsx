import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../../lib/api";
import { useState } from "react";
import { toast } from "sonner";

const farmSchema = z.object({
  name: z.string().min(2, "Názov je povinný"),
  description: z.string().optional(),
  city: z.string().min(2, "Mesto je povinné"),
  street: z.string().min(2, "Ulica je povinná"),
  region: z.string().min(2, "Región je povinný"),
  postalCode: z.string().min(2, "PSČ je povinné"),
  country: z.string().min(2, "Krajina je povinná"),
});

type FarmFormData = z.infer<typeof farmSchema>;

export const Route = createFileRoute("/farm/")({
  component: FarmPage,
});

function FarmPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

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
  } = useQuery({
    queryKey: ["farms"],
    queryFn: async () => apiFetch("/farm"),
  });

  const createFarm = useMutation({
    mutationFn: async (data: FarmFormData) => {
      const res = await apiFetch("/farm", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res;
    },
    onSuccess: () => {
      form.reset();
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
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold">{t("farmPage.title")}</h2>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>{t("farmPage.addFarm")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("farmPage.newFarm")}</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-3 mt-2"
            >
              <Input
                placeholder={t("farmPage.name")}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-sm">
                  {form.formState.errors.name.message}
                </p>
              )}

              <Textarea
                placeholder={t("farmPage.description")}
                {...form.register("description")}
              />

              <Input
                placeholder={t("farmPage.city")}
                {...form.register("city")}
              />
              <Input
                placeholder={t("farmPage.street")}
                {...form.register("street")}
              />
              <Input
                placeholder={t("farmPage.region")}
                {...form.register("region")}
              />
              <Input
                placeholder={t("farmPage.postalCode")}
                {...form.register("postalCode")}
              />
              <Input
                placeholder={t("farmPage.country")}
                {...form.register("country")}
              />

              <Button
                type="submit"
                className="w-full mt-3"
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

      {farms.length === 0 ? (
        <p className="text-gray-500">{t("farmPage.noFarms")}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm: any) => {
            const imageUrl = farm.images?.[0]?.url;

            return (
              <Card
                key={farm.id}
                className="shadow-md cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => navigate({ to: `/farm/${farm.id}` })}
              >
                <CardHeader className="p-0">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={farm.name}
                      className="h-40 w-full object-cover rounded-t-md"
                    />
                  ) : (
                    <div className="h-40 bg-gray-200 flex items-center justify-center text-gray-500">
                      {t("farmPage.noImage")}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-xl font-semibold mb-1">
                    {farm.name}
                  </CardTitle>
                  <p className="text-gray-700 text-sm">
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
