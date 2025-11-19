import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "name must be at least 2 char long"),
  phone: z
    .string()
    .min(6, "phone must be at least 6 char long")
    .regex(/^\+?\d{6,15}$/, "invalid phone number"),
  address: z.string().min(5, "address must be at least 5 char long"),
  postalCode: z.string().min(3, "postal code must be at least 3 char long"),
  city: z.string().min(2, "city must be at least 2 char long"),
  country: z.string().min(2, "country must be at least 2 char long"),
  profileImageUrl: z.string().url().nullable().optional(),
  profileImagePublicId: z.string().nullable().optional(),
});

export const deleteProfileSchema = z.object({
  password: z.string().min(6, "password must be at least 6 char long"),
});
