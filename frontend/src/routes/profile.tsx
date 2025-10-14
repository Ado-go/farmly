import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
});

const updateProfileSchema = z.object({
  name: z.string().min(2, "registerPage.name_min"),
  phone: z
    .string()
    .min(6, "registerPage.phone_min")
    .regex(/^\+?\d{6,15}$/, "registerPage.phone_invalid"),
  role: z.enum(["CUSTOMER", "FARMER"]),
});

const deleteProfileSchema = z.object({
  password: z.string().min(1, "profilePage.deletePasswordLabel"),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;
type DeleteProfileForm = z.infer<typeof deleteProfileSchema>;

function ProfilePage() {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiFetch("/profile"),
    retry: false,
  });

  useEffect(() => {
    if (data?.user) setUser(data.user);
  }, [data, setUser]);

  const {
    register: updateRegister,
    handleSubmit: handleUpdateSubmit,
    reset: resetUpdate,
    formState: { errors: updateErrors },
  } = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      name: data?.user?.name ?? "",
      phone: data?.user?.phone ?? "",
      role: data?.user?.role ?? "CUSTOMER",
    },
  });

  const {
    register: deleteRegister,
    handleSubmit: handleDeleteSubmit,
    reset: resetDelete,
    formState: { errors: deleteErrors },
  } = useForm<DeleteProfileForm>({
    resolver: zodResolver(deleteProfileSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (values: UpdateProfileForm) =>
      apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setUser(data.user);
      setIsEditing(false);
      toast.success(t("profilePage.updateSuccess"));
    },
    onError: () => toast.error(t("profilePage.updateError")),
  });

  const deleteMutation = useMutation({
    mutationFn: (values: DeleteProfileForm) =>
      apiFetch("/profile", {
        method: "DELETE",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      setUser(null);
      toast.success(t("profilePage.deleteSuccess"));
      navigate({ to: "/" });
    },
    onError: () => toast.error(t("profilePage.deleteError")),
  });

  if (isLoading) return <p>{t("profilePage.loading")}</p>;
  if (isError)
    return <p className="text-red-500">{t("profilePage.loadError")}</p>;

  const user = data.user;
  const onUpdate = (values: UpdateProfileForm) => updateMutation.mutate(values);
  const onDelete = (values: DeleteProfileForm) => {
    deleteMutation.mutate(values);
    resetDelete();
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleUpdateSubmit(onUpdate)} className="space-y-4">
            <div>
              <Label>{t("profilePage.name_label")}</Label>
              {isEditing ? (
                <>
                  <Input {...updateRegister("name")} />
                  {updateErrors.name && (
                    <p className="text-red-500">
                      {t(updateErrors.name.message!)}
                    </p>
                  )}
                </>
              ) : (
                <p>{user.name}</p>
              )}
            </div>

            <div>
              <Label>{t("profilePage.email_label")}</Label>
              <p>{user.email}</p>
            </div>

            <div>
              <Label>{t("profilePage.role_label")}</Label>
              {isEditing ? (
                <select
                  {...updateRegister("role")}
                  className="border p-2 rounded w-full"
                >
                  <option value="CUSTOMER">
                    {t("registerPage.role_customer")}
                  </option>
                  <option value="FARMER">
                    {t("registerPage.role_farmer")}
                  </option>
                </select>
              ) : (
                <p>{user.role}</p>
              )}
            </div>

            <div>
              <Label>{t("profilePage.phone_label")}</Label>
              {isEditing ? (
                <>
                  <Input {...updateRegister("phone")} />
                  {updateErrors.phone && (
                    <p className="text-red-500">
                      {t(updateErrors.phone.message!)}
                    </p>
                  )}
                </>
              ) : (
                <p>{user.phone}</p>
              )}
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {t("profilePage.save")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setIsEditing(false);
                    resetUpdate();
                  }}
                >
                  {t("profilePage.cancel")}
                </Button>
              </div>
            ) : (
              <Button type="button" onClick={() => setIsEditing(true)}>
                {t("profilePage.edit")}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="destructive" className="w-full">
            {t("profilePage.delete")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profilePage.deleteTitle")}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleDeleteSubmit(onDelete)} className="space-y-4">
            <div>
              <Label>{t("profilePage.deletePasswordLabel")}</Label>
              <Input
                type="password"
                {...deleteRegister("password")}
                placeholder=""
              />
              {deleteErrors.password && (
                <p className="text-red-500">
                  {t(deleteErrors.password.message!)}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={deleteMutation.isPending}
            >
              {t("profilePage.delete")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
