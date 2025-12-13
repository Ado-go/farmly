import { z } from "zod";

export const farmSchema = z.object({
  name: z.string().trim().min(1, "This field is mandatory"),
  description: z.string().trim().optional(),
  city: z.string().trim().min(1, "This field is mandatory"),
  street: z.string().trim().min(1, "This field is mandatory"),
  region: z.string().trim().min(1, "This field is mandatory"),
  postalCode: z.string().trim().min(1, "This field is mandatory"),
  country: z.string().trim().min(1, "This field is mandatory"),
  images: z
    .array(
      z.object({
        url: z.string().trim().url("Invalid image URL"),
        publicId: z.string(),
      })
    )
    .optional(),
});
