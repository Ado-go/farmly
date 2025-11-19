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
