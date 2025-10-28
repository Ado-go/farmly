import { z } from "zod";

const imageSchema = z.object({
  url: z.string("Image URL is required").url("Invalid image URL"),
});

export const eventProductSchema = z.object({
  eventId: z.number("Event ID is required").int().positive(),

  name: z
    .string("Product name is required")
    .min(2, "Product name must be at least 2 characters long"),

  category: z
    .string("Category is required")
    .min(2, "Category must be at least 2 characters long"),

  description: z
    .string("Description is required")
    .min(5, "Description must be at least 5 characters long"),

  basePrice: z
    .number("Base price must be a number")
    .min(0, "Base price cannot be negative")
    .optional(),

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
