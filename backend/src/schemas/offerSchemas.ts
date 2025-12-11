import { z } from "zod";
import { productCategorySchema } from "../constants/productCategories.ts";

const imageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  publicId: z.string().min(1, "Missing publicId"),
});

const productSchema = z.object({
  name: z.string().min(2, "Product name is required"),
  category: productCategorySchema,
  description: z.string().optional(),
  basePrice: z.number().positive("Base price must be positive"),
  images: z.array(imageSchema).optional(),
});

export const offerSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  product: productSchema,
});

export const offerUpdateSchema = offerSchema
  .omit({ product: true })
  .partial()
  .extend({
    product: productSchema.partial(),
  });

export const offerRespondSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters long")
    .max(1000, "Message must be at most 1000 characters long"),
});
