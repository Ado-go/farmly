import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "registerPage.name_min"),
  phone: z
    .string()
    .trim()
    .min(1, "registerPage.phone_min")
    .regex(/^\+?\d{6,15}$/, "registerPage.phone_invalid"),
  address: z.string().trim().min(1, "registerPage.address_min"),
  postalCode: z.string().trim().min(1, "registerPage.postal_min"),
  city: z.string().trim().min(1, "registerPage.city_min"),
  country: z.string().trim().min(1, "registerPage.country_min"),
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
