import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "name must be at least 2 char long"),
  phone: z
    .string()
    .min(6, "phone must be at least 6 char long")
    .regex(/^\+?\d{6,15}$/, "invalid phone number"),
  email: z
    .string()
    .min(1, "email is required")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "invalid email address"),
  password: z.string().min(6, "password must be at least 6 char long"),
  role: z.enum(["CUSTOMER", "FARMER"]),
});

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "email is required")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "invalid email address"),
  password: z.string().min(1, "password is required"),
});
