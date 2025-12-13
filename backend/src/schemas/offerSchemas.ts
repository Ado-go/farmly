import { z } from "zod";
import { productCategorySchema } from "../constants/productCategories.ts";

const imageSchema = z.object({
  url: z.string().trim().url("Invalid image URL"),
  publicId: z.string().trim().min(1, "Missing publicId"),
});

const productSchema = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  category: productCategorySchema,
  description: z.string().trim().optional(),
  basePrice: z.number().positive("Base price must be positive"),
  images: z.array(imageSchema).optional(),
});

export const offerSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
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
    .min(1, "Message is required")
    .max(1000, "Message must be at most 1000 characters long"),
});
