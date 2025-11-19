import { z } from "zod";

const imageSchema = z.object({
  url: z.string().url("Invalid image URL"),
  publicId: z.string().min(1, "Missing publicId"),
});

export const offerSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().optional(),
  category: z.string().min(2, "Category is required"),
  price: z.number().positive("Price must be positive"),
  product: z.object({
    name: z.string().min(2, "Product name is required"),
    category: z.string().min(2, "Product category is required"),
    description: z.string().optional(),
    basePrice: z.number().positive("Base price must be positive").optional(),
    images: z.array(imageSchema).optional(),
  }),
});
