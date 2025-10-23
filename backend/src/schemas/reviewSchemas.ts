import { z } from "zod";

export const reviewCreateSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const reviewUpdateSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});
