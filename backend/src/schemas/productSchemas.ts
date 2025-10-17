import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  rating: z.number().min(0).max(5).optional(),
  farmId: z.number(),
  images: z
    .array(
      z.object({
        url: z.string().url("Invalid image URL"),
      })
    )
    .optional(),
});
