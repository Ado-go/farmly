import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "loginPage.requiredEmail")
    .email("loginPage.invalidEmail"),
  password: z.string().trim().min(1, "loginPage.requiredPassword"),
});

export type LoginForm = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
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
  email: z
    .string()
    .trim()
    .min(1, "registerPage.emailRequired")
    .email("registerPage.emailInvalid"),
  password: z
    .string()
    .trim()
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
      "registerPage.passwordMin"
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
