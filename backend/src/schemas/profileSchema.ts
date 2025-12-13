import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  phone: z
    .string()
    .trim()
    .min(1, "phone is required")
    .regex(/^\+?\d{6,15}$/, "invalid phone number"),
  address: z.string().trim().min(1, "address is required"),
  postalCode: z.string().trim().min(1, "postal code is required"),
  city: z.string().trim().min(1, "city is required"),
  country: z.string().trim().min(1, "country is required"),
  profileImageUrl: z.string().url().nullable().optional(),
  profileImagePublicId: z.string().nullable().optional(),
});

export const deleteProfileSchema = z.object({
  password: z.string().trim().min(1, "password is required"),
});
