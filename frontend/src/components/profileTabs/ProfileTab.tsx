import { useState, useEffect, useRef } from "react";
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
import { User as UserIcon } from "lucide-react";

const updateProfileSchema = z.object({
  name: z.string().min(2, "registerPage.name_min"),
  phone: z
    .string()
    .min(6, "registerPage.phone_min")
    .regex(/^\+?\d{6,15}$/, "registerPage.phone_invalid"),
  address: z.string().min(5, "registerPage.address_min"),
  postalCode: z.string().min(3, "registerPage.postal_min"),
  city: z.string().min(2, "registerPage.city_min"),
  country: z.string().min(2, "registerPage.country_min"),
});

const deleteProfileSchema = z.object({
  password: z.string().min(1, "profilePage.deletePasswordLabel"),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(6, "profilePage.oldPasswordRequired"),
  newPassword: z.string().min(6, "profilePage.newPasswordMin"),
});

type UpdateProfileForm = z.infer<typeof updateProfileSchema>;
type ProfileImagePayload = {
  profileImageUrl?: string | null;
  profileImagePublicId?: string | null;
};
type UpdateProfilePayload = UpdateProfileForm & ProfileImagePayload;
type DeleteProfileForm = z.infer<typeof deleteProfileSchema>;
type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function ProfileTab() {
  const { t } = useTranslation();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const { data } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiFetch("/profile"),
  });

  const user = data?.user;

  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  const resetAvatarToUser = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setAvatarPreview(user?.profileImageUrl ?? null);
    setAvatarFile(null);
    setRemoveAvatar(false);
  };

  useEffect(() => {
    resetAvatarToUser();
  }, [user]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const updateForm = useForm<UpdateProfileForm>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      address: user?.address ?? "",
      postalCode: user?.postalCode ?? "",
      city: user?.city ?? "",
      country: user?.country ?? "",
    },
  });

  const deleteForm = useForm<DeleteProfileForm>({
    resolver: zodResolver(deleteProfileSchema),
  });

  const passwordForm = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const updateMutation = useMutation({
    mutationFn: (values: UpdateProfilePayload) =>
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;
    setAvatarPreview(previewUrl);
    setAvatarFile(file);
    setRemoveAvatar(false);
    setIsEditing(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAvatar = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setAvatarPreview(null);
    setAvatarFile(null);
    setRemoveAvatar(true);
    setIsEditing(true);
  };

  const onSubmitUpdate = updateForm.handleSubmit(async (values) => {
    const payload: UpdateProfilePayload = { ...values };
    try {
      if (avatarFile) {
        const fd = new FormData();
        fd.append("image", avatarFile);
        const res = await apiFetch("/upload", { method: "POST", body: fd });
        payload.profileImageUrl = res.optimizedUrl || res.url;
        payload.profileImagePublicId = res.publicId;
      } else if (removeAvatar) {
        payload.profileImageUrl = null;
        payload.profileImagePublicId = null;
      }

      await updateMutation.mutateAsync(payload);
    } catch (err) {
      console.error(err);
      toast.error(t("profilePage.updateError"));
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("profile")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={onSubmitUpdate}
            className="space-y-4"
          >
            <div>
              <Label>{t("profilePage.photo_label")}</Label>
              <div className="flex flex-col sm:flex-row items-start gap-4 mt-2">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={t("profilePage.photo_label")}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {t("profilePage.photo_upload")}
                  </Button>
                  {(avatarPreview || removeAvatar) && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleRemoveAvatar}
                    >
                      {t("profilePage.photo_remove")}
                    </Button>
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

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
              <p>{user?.role}</p>
            </div>

            <div>
              <Label>{t("profilePage.phone_label")}</Label>
              {isEditing ? (
                <Input {...updateForm.register("phone")} />
              ) : (
                <p>{user?.phone}</p>
              )}
            </div>

            <div>
              <Label>{t("profilePage.address_label")}</Label>
              {isEditing ? (
                <Input {...updateForm.register("address")} />
              ) : (
                <p>{user?.address}</p>
              )}
            </div>

            <div>
              <Label>{t("profilePage.postal_label")}</Label>
              {isEditing ? (
                <Input {...updateForm.register("postalCode")} />
              ) : (
                <p>{user?.postalCode}</p>
              )}
            </div>

            <div>
              <Label>{t("profilePage.city_label")}</Label>
              {isEditing ? (
                <Input {...updateForm.register("city")} />
              ) : (
                <p>{user?.city}</p>
              )}
            </div>

            <div>
              <Label>{t("profilePage.country_label")}</Label>
              {isEditing ? (
                <Input {...updateForm.register("country")} />
              ) : (
                <p>{user?.country}</p>
              )}
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <Button type="submit">{t("profilePage.save")}</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    resetAvatarToUser();
                    setIsEditing(false);
                  }}
                >
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
