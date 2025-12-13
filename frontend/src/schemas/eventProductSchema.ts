import type { TFunction } from "i18next";
import { z } from "zod";
import { PRODUCT_CATEGORIES } from "@/lib/productCategories";

export const buildEventProductSchema = (t: TFunction) => {
  const priceField = z
    .number()
    .refine((val) => !Number.isNaN(val), {
      message: t("eventProducts.errors.priceType"),
    })
    .min(0, { message: t("eventProducts.errors.priceMin") });

  const stockField = z
    .number()
    .int()
    .refine((val) => !Number.isNaN(val), {
      message: t("eventProducts.errors.stockType"),
    })
    .min(0, { message: t("eventProducts.errors.stockMin") });

  return z.object({
    name: z.string().trim().min(1, t("eventProducts.errors.name")),
    category: z.enum(PRODUCT_CATEGORIES, {
      message: t("eventProducts.errors.category"),
    }),
    description: z.string().trim().min(1, t("eventProducts.errors.description")),
    price: priceField,
    stock: stockField,
    eventId: z.number(),
  });
};

export type EventProductForm = z.infer<
  ReturnType<typeof buildEventProductSchema>
>;
