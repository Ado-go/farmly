import { z } from "zod";

export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Title is required")
      .max(100, "Title must not exceed 100 characters"),

    description: z
      .string()
      .trim()
      .max(1000, "Description must not exceed 1000 characters")
      .optional(),

    stallName: z
      .string()
      .trim()
      .min(1, "Stall name is required")
      .max(100, "Stall name must not exceed 100 characters"),

    startDate: z
      .string()
      .trim()
      .min(1, "Start date is required")
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Start date must be a valid date",
      }),

    endDate: z
      .string()
      .trim()
      .min(1, "End date is required")
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "End date must be a valid date",
      }),

    city: z
      .string()
      .trim()
      .min(1, "City name is required")
      .max(100, "City name must not exceed 100 characters"),

    street: z
      .string()
      .trim()
      .min(1, "Street is required")
      .max(150, "Street must not exceed 150 characters"),

    region: z
      .string()
      .trim()
      .min(1, "Region is required")
      .max(100, "Region must not exceed 100 characters"),

    postalCode: z
      .string()
      .trim()
      .min(1, "Postal code is required")
      .max(20, "Postal code must not exceed 20 characters"),

    country: z
      .string()
      .trim()
      .min(1, "Country is required")
      .max(100, "Country must not exceed 100 characters"),
    images: z
      .array(
        z.object({
          url: z.string().url("Invalid image URL"),
          publicId: z.string(),
        })
      )
      .optional(),
  })
  .superRefine((data, ctx) => {
    const start = Date.parse(data.startDate);
    const end = Date.parse(data.endDate);
    if (end <= start) {
      ctx.addIssue({
        path: ["endDate"],
        code: z.ZodIssueCode.custom,
        message: "End date must be after start date",
      });
    }
  });
