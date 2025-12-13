import type { TFunction } from "i18next";
import { z } from "zod";

export const PRODUCT_CATEGORIES = [
  "Fruits",
  "Vegetables",
  "Meat",
  "Dairy",
  "Bakery",
  "Drinks",
  "Other",
] as const;

export const productCategorySchema = z.enum(PRODUCT_CATEGORIES);

export type ProductCategory = z.infer<typeof productCategorySchema>;

export const PRODUCT_CATEGORY_OPTIONS = PRODUCT_CATEGORIES.map((value) => ({
  value,
}));

export const getCategoryLabel = (
  category: string | undefined,
  t: TFunction
) => {
  if (!category) return "";
  return t(`productCategories.${category}`, { defaultValue: category });
};
