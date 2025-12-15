import { useState, useEffect, useRef, useCallback } from "react";
import type React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { apiFetch } from "@/lib/api";
import {
  changePasswordSchema,
  deleteProfileSchema,
  updateProfileSchema,
  type ChangePasswordForm,
  type DeleteProfileForm,
  type UpdateProfileForm,
} from "@/schemas/profileSchema";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Lock, ShieldOff, User } from "lucide-react";

type ProfileImagePayload = {
  profileImageUrl?: string | null;
  profileImagePublicId?: string | null;
};
type UpdateProfilePayload = UpdateProfileForm & ProfileImagePayload;

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
  const roleLabel =
    user?.role && t(`roles.${user.role}`, { defaultValue: user.role });

  useEffect(() => {
    if (user) setUser(user);
  }, [user, setUser]);

  const resetAvatarToUser = useCallback(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setAvatarPreview(user?.profileImageUrl ?? null);
    setAvatarFile(null);
    setRemoveAvatar(false);
  }, [user]);

  useEffect(() => {
    resetAvatarToUser();
  }, [resetAvatarToUser]);

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
    if (!isEditing) return;

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

  const readOnlyFields = (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label={t("profilePage.nameLabel")} value={user?.name} />
      <Field label={t("profilePage.emailLabel")} value={user?.email} />
      <Field label={t("profilePage.phoneLabel")} value={user?.phone} />
      <Field
        label={t("profilePage.roleLabel")}
        value={roleLabel || user?.role}
      />
      <Field label={t("profilePage.addressLabel")} value={user?.address} />
      <Field label={t("profilePage.cityLabel")} value={user?.city} />
      <Field label={t("profilePage.postalLabel")} value={user?.postalCode} />
      <Field label={t("profilePage.countryLabel")} value={user?.country} />
    </div>
  );

  const editableFields = (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label={t("profilePage.nameLabel")} editing value={user?.name}>
        <Input {...updateForm.register("name")} />
      </Field>
      <Field label={t("profilePage.emailLabel")} value={user?.email} />
      <Field label={t("profilePage.phoneLabel")} editing value={user?.phone}>
        <Input {...updateForm.register("phone")} />
      </Field>
      <Field
        label={t("profilePage.roleLabel")}
        value={roleLabel || user?.role}
      />
      <Field
        label={t("profilePage.addressLabel")}
        editing
        value={user?.address}
      >
        <Input {...updateForm.register("address")} />
      </Field>
      <Field label={t("profilePage.cityLabel")} editing value={user?.city}>
        <Input {...updateForm.register("city")} />
      </Field>
      <Field
        label={t("profilePage.postalLabel")}
        editing
        value={user?.postalCode}
      >
        <Input {...updateForm.register("postalCode")} />
      </Field>
      <Field
        label={t("profilePage.countryLabel")}
        editing
        value={user?.country}
      >
        <Input {...updateForm.register("country")} />
      </Field>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-none shadow-lg ring-1 ring-emerald-100 bg-gradient-to-br from-emerald-50 to-white dark:bg-popover dark:from-popover dark:to-popover dark:ring-emerald-400/30">
        <CardHeader className="relative pb-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-emerald-200 bg-white shadow-sm dark:border-emerald-500/40 dark:bg-popover">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={t("profilePage.photoLabel")}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">
                    <User className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-semibold text-emerald-900 dark:text-white">
                  {user?.name || t("profile")}
                </h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-50">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-300" />
                  {roleLabel}
                </span>
              </div>
            </div>

            {isEditing && (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t("profilePage.photoUpload")}
                </Button>
                {(avatarPreview || removeAvatar) && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRemoveAvatar}
                  >
                    {t("profilePage.photoRemove")}
                  </Button>
                )}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </CardHeader>

        <CardContent className="space-y-4">
          {isEditing ? (
            <form onSubmit={onSubmitUpdate} className="space-y-4">
              {editableFields}

              <div className="flex flex-wrap justify-end gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending
                    ? t("profilePage.saving")
                    : t("profilePage.save")}
                </Button>
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
            </form>
          ) : (
            <>{readOnlyFields}</>
          )}

          <div className="mt-8 flex flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center lg:gap-6">
            <div className="w-full max-w-3xl rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/30 p-4 shadow-inner dark:border-border dark:from-popover dark:via-popover dark:to-popover">
              <div className="mb-3 space-y-1">
                <p className="text-sm font-semibold text-emerald-900 dark:text-white">
                  {t("profilePage.accountActionsTitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("profilePage.accountActionsDesc")}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-full w-full justify-start gap-3 rounded-lg border-emerald-200 bg-white/80 text-emerald-900 shadow-sm hover:bg-emerald-50 dark:border-emerald-300/30 dark:bg-popover dark:text-white dark:hover:bg-emerald-900/30"
                    >
                      <Lock className="h-4 w-4 text-emerald-700" />
                      <span className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-semibold">
                          {t("profilePage.changePassword")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("profilePage.changePasswordTitle")}
                        </span>
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {t("profilePage.changePasswordTitle")}
                      </DialogTitle>
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

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-full w-full justify-start gap-3 rounded-lg border-red-200 bg-white/80 text-red-800 shadow-sm hover:bg-red-50 dark:border-red-400/40 dark:bg-popover dark:text-red-100 dark:hover:bg-red-900/30"
                    >
                      <ShieldOff className="h-4 w-4 text-red-600" />
                      <span className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-semibold">
                          {t("profilePage.delete")}
                        </span>
                        <span className="text-xs text-red-700 opacity-90">
                          {t("profilePage.deleteTitle")}
                        </span>
                      </span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("profilePage.deleteTitle")}</DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={deleteForm.handleSubmit((v) =>
                        deleteMutation.mutate(v)
                      )}
                      className="space-y-4"
                    >
                      <Input
                        type="password"
                        {...deleteForm.register("password")}
                        placeholder={t("profilePage.deletePasswordLabel")}
                      />
                      <Button
                        variant="destructive"
                        type="submit"
                        className="w-full"
                      >
                        {t("profilePage.delete")}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {!isEditing && (
              <Button
                variant="outline"
                className="w-full max-w-xs justify-start gap-3 rounded-lg border-emerald-200 bg-white/90 px-6 py-5 text-emerald-900 shadow-sm hover:bg-emerald-50 lg:self-stretch dark:border-emerald-300/30 dark:bg-popover dark:text-white dark:hover:bg-emerald-900/30"
                onClick={() => setIsEditing(true)}
              >
                <span className="flex flex-col items-start gap-1">
                  <span className="text-sm font-semibold">
                    {t("profilePage.edit")}
                  </span>
                  <span className="text-xs text-muted-foreground leading-relaxed">
                    {t("profilePage.updateProfile")}
                  </span>
                </span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  children,
  editing = false,
}: {
  label: string;
  value?: string | null;
  children?: React.ReactNode;
  editing?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-white/70 p-3 shadow-sm dark:border-border dark:bg-popover">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1 text-sm text-gray-900 dark:text-white">
        {editing && children ? (
          <div className="mt-1">{children}</div>
        ) : (
          <p className="break-words">{value || "—"}</p>
        )}
      </div>
    </div>
  );
}
