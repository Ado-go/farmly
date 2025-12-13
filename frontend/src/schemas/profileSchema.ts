import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "registerPage.nameMin"),
  phone: z
    .string()
    .trim()
    .min(1, "registerPage.phoneMin")
    .regex(/^\+?\d{6,15}$/, "registerPage.phoneInvalid"),
  address: z.string().trim().min(1, "registerPage.addressMin"),
  postalCode: z.string().trim().min(1, "registerPage.postalMin"),
  city: z.string().trim().min(1, "registerPage.cityMin"),
  country: z.string().trim().min(1, "registerPage.countryMin"),
});

export const deleteProfileSchema = z.object({
  password: z.string().trim().min(1, "profilePage.deletePasswordLabel"),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().trim().min(1, "profilePage.oldPasswordRequired"),
  newPassword: z
    .string()
    .trim()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      "profilePage.newPasswordMin"
    ),
});

export type UpdateProfileForm = z.infer<typeof updateProfileSchema>;
export type DeleteProfileForm = z.infer<typeof deleteProfileSchema>;
export type ChangePasswordForm = z.infer<typeof changePasswordSchema>;
