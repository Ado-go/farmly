import { z } from "zod";

export const eventSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters long")
      .max(100, "Title must not exceed 100 characters"),

    description: z
      .string()
      .max(1000, "Description must not exceed 1000 characters")
      .optional(),

    startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Start date must be a valid date",
    }),

    endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "End date must be a valid date",
    }),

    city: z
      .string()
      .min(2, "City name must be at least 2 characters long")
      .max(100, "City name must not exceed 100 characters"),

    street: z
      .string()
      .min(2, "Street must be at least 2 characters long")
      .max(150, "Street must not exceed 150 characters"),

    region: z
      .string()
      .min(2, "Region must be at least 2 characters long")
      .max(100, "Region must not exceed 100 characters"),

    postalCode: z
      .string()
      .min(3, "Postal code must be at least 3 characters long")
      .max(20, "Postal code must not exceed 20 characters"),

    country: z
      .string()
      .min(2, "Country must be at least 2 characters long")
      .max(100, "Country must not exceed 100 characters"),
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
