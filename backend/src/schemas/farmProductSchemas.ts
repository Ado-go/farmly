import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  price: z.number("Price is required").positive("Price must be positive"),
  stock: z
    .number("Stock must be a number")
    .int()
    .nonnegative("Stock cannot be negative")
    .default(0),
  farmId: z.number("Farm ID is required"),

  images: z
    .array(
      z.object({
        url: z.string().url("Invalid image URL"),
        publicId: z.string().min(1, "Missing publicId"),
      })
    )
    .optional(),
});
