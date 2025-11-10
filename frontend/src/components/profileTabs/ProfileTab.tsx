import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { apiFetch } from "@/lib/api";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

const changePasswordSchema = z.object({
  oldPassword: z.string().min(6, "profilePage.oldPasswordRequired"),
  newPassword: z.string().min(6, "profilePage.newPasswordMin"),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;
type DeleteProfileForm = z.infer<typeof deleteProfileSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ProfileTab() {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiFetch("/profile"),
  });

  const user = data?.user;

  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  const updateForm = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      role: user?.role ?? "CUSTOMER",
    },
  });

  const deleteForm = useForm<DeleteProfileForm>({
    resolver: zodResolver(deleteProfileSchema),
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (values: UpdateProfileForm) =>
      apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      setUser(data.user);
      toast.success(t("profilePage.updateSuccess"));
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (values: DeleteProfileForm) =>
      apiFetch("/profile", {
        method: "DELETE",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success(t("profilePage.deleteSuccess"));
      setUser(null);
      navigate({ to: "/" });
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (values: ChangePasswordForm) =>
      apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success(t("profilePage.passwordChangeSuccess"));
      passwordForm.reset();
      setOpen(false);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={updateForm.handleSubmit((v) => updateMutation.mutate(v))}
            className="space-y-4"
          >
            <div>
              <Label>{t("profilePage.name_label")}</Label>
              {isEditing ? (
                <Input {...updateForm.register("name")} />
              ) : (
                <p>{user?.name}</p>
              )}
            </div>

            <div>
              <Label>{t("profilePage.email_label")}</Label>
              <p>{user?.email}</p>
            </div>

            <div>
              <Label>{t("profilePage.role_label")}</Label>
              {isEditing ? (
                <select
                  {...updateForm.register("role")}
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
                <p>{user?.role}</p>
              )}
            </div>

            <div>
              <Label>{t("profilePage.phone_label")}</Label>
              {isEditing ? (
                <Input {...updateForm.register("phone")} />
              ) : (
                <p>{user?.phone}</p>
              )}
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <Button type="submit">{t("profilePage.save")}</Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)}>
                  {t("profilePage.cancel")}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
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
          <form
            onSubmit={deleteForm.handleSubmit((v) => deleteMutation.mutate(v))}
            className="space-y-4"
          >
            <Input
              type="password"
              {...deleteForm.register("password")}
              placeholder={t("profilePage.deletePasswordLabel")}
            />
            <Button variant="destructive" type="submit" className="w-full">
              {t("profilePage.delete")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            {t("profilePage.changePassword")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profilePage.changePasswordTitle")}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={passwordForm.handleSubmit((v) =>
              passwordMutation.mutate(v)
            )}
            className="space-y-4"
          >
            <Input
              type="password"
              {...passwordForm.register("oldPassword")}
              placeholder={t("profilePage.oldPasswordLabel")}
            />
            <Input
              type="password"
              {...passwordForm.register("newPassword")}
              placeholder={t("profilePage.newPasswordLabel")}
            />
            <Button type="submit" className="w-full">
              {t("profilePage.savePassword")}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
