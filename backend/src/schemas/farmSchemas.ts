import { z } from "zod";

export const farmSchema = z.object({
  name: z.string().min(2, "This field is mandatory"),
  description: z.string().optional(),
  city: z.string().min(2, "This field is mandatory"),
  street: z.string().min(2, "This field is mandatory"),
  region: z.string().min(2, "This field is mandatory"),
  postalCode: z.string().min(2, "This field is mandatory"),
  country: z.string().min(2, "This field is mandatory"),
});
