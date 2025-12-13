import { z } from "zod";

export const registerSchema = z.object({
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
  email: z.string().trim().min(1, "email is required").email("invalid email address"),
  password: z
    .string()
    .trim()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      "password must be at least 8 characters and include uppercase, lowercase, and a number"
    ),
  role: z.enum(["CUSTOMER", "FARMER"]),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "email is required")
    .email("invalid email address"),
  password: z.string().trim().min(1, "password is required"),
});
