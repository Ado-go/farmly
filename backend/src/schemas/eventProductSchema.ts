import { z } from "zod";
import { productCategorySchema } from "../constants/productCategories.ts";

const imageSchema = z.object({
  url: z.string("Image URL is required").url("Invalid image URL"),
});

const priceSchema = z
  .number("Price is required")
  .min(0, "Price cannot be negative")
  .refine((val) => !Number.isNaN(val), {
    message: "Price must be a valid number",
  });

const stockSchema = z
  .number("Stock is required")
  .int("Stock must be a whole number")
  .min(0, "Stock cannot be negative");

export const eventProductSchema = z.object({
  eventId: z.number("Event ID is required").int().positive(),

  name: z
    .string("Product name is required")
    .min(2, "Product name must be at least 2 characters long"),

  category: productCategorySchema,

  description: z
    .string("Description is required")
    .min(5, "Description must be at least 5 characters long"),

  price: priceSchema,
  stock: stockSchema,

  images: z
    .array(imageSchema)
    .optional()
    .refine(
      (images) =>
        !images ||
        images.length === 0 ||
        images.every((img) => img.url && img.url.trim().length > 0),
      { message: "Each image must have a valid URL" }
    ),
});
