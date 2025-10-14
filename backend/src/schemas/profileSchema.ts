import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "name must be at least 2 char long"),
  phone: z
    .string()
    .min(6, "phone must be at least 6 char long")
    .regex(/^\+?\d{6,15}$/, "invalid phone number"),
  role: z.enum(["CUSTOMER", "FARMER"]),
});

export const deleteProfileSchema = z.object({
  password: z.string().min(6, "password must be at least 6 char long"),
});
