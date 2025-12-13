import type { TFunction } from "i18next";
import { z } from "zod";
import {
  PRODUCT_CATEGORIES,
  productCategorySchema,
} from "@/schemas/productCategorySchema";

export const createProductSchema = (t: TFunction) =>
  z.object({
    name: z.string().trim().min(1, { message: t("product.validation.name") }),
    category: z.enum(PRODUCT_CATEGORIES),
    description: z.string().trim().optional(),
    price: z.number().positive({
      message: t("product.validation.pricePositive"),
    }),
    stock: z.number().min(0, {
      message: t("product.validation.stockNonNegative"),
    }),
    isAvailable: z.boolean().default(true),
  });

export const productSchema = z.object({
  name: z.string().trim().min(1, "Názov je povinný"),
  category: productCategorySchema.optional(),
  description: z.string().trim().optional(),
  price: z.number().min(0, "Cena musí byť väčšia ako 0"),
  stock: z.number().min(0, "Sklad musí byť nezáporný"),
  isAvailable: z.boolean().default(true),
});

export type ProductCreateFormData = z.infer<ReturnType<typeof createProductSchema>>;
export type ProductEditFormData = z.infer<typeof productSchema>;
