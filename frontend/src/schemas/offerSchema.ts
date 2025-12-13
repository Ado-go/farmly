import type { TFunction } from "i18next";
import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/schemas/productCategorySchema";

const nonNegativeNumber = (requiredKey: string, minKey: string) =>
  z
    .number({ message: requiredKey })
    .refine((value) => Number.isFinite(value), { message: requiredKey })
    .gt(0, { message: minKey });

export const offerSchema = z.object({
  title: z
    .string({ message: "offersPage.errors.titleRequired" })
    .trim()
    .min(1, { message: "offersPage.errors.titleRequired" }),
  description: z.string().optional(),
  productName: z
    .string({ message: "offersPage.errors.productNameRequired" })
    .trim()
    .min(1, { message: "offersPage.errors.productNameRequired" }),
  productDescription: z.string().optional(),
  productCategory: z.enum(PRODUCT_CATEGORIES, {
    message: "offersPage.errors.productCategoryRequired",
  }),
  productPrice: nonNegativeNumber(
    "offersPage.errors.productPriceRequired",
    "offersPage.errors.productPriceMin"
  ),
});

export type OfferFormData = z.infer<typeof offerSchema>;

export const buildRespondSchema = (t: TFunction) =>
  z.object({
    email: z.string().trim().email(t("offersPage.respond.emailError")),
    message: z
      .string()
      .trim()
      .min(1, t("offersPage.respond.messageError"))
      .max(1000, t("offersPage.respond.messageMax")),
  });

export type RespondForm = z.infer<ReturnType<typeof buildRespondSchema>>;
