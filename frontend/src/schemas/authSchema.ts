import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "loginPage.required_email")
    .email("loginPage.invalid_email"),
  password: z.string().trim().min(1, "loginPage.required_password"),
});

export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
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
  email: z
    .string()
    .trim()
    .min(1, "registerPage.email_required")
    .email("registerPage.email_invalid"),
  password: z
    .string()
    .trim()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      "registerPage.password_min"
    ),
  role: z.enum(["CUSTOMER", "FARMER"]),
});

export type RegisterForm = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "forgotPasswordPage.errors.requiredEmail")
    .email("forgotPasswordPage.errors.invalidEmail"),
});

export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .trim()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      "resetPasswordPage.errors.shortPassword"
    ),
});

export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
