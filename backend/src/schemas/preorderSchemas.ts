import { z } from "zod";

export const preorderItemSchema = z.object({
  productId: z.number(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0),
  productName: z.string().min(1),
  sellerName: z.string().min(1),
});

export const preorderSchema = z.object({
  eventId: z.number(),
  cartItems: z.array(preorderItemSchema).min(1, "Cart cannot be empty"),
  userInfo: z
    .object({
      buyerId: z.number().int().positive().optional(),
      email: z.string().email("Invalid email address"),
      contactName: z.string().min(2, "Name must be at least 2 characters"),
      contactPhone: z
        .string()
        .min(6, "Phone must have at least 6 digits")
        .regex(/^\+?\d{6,15}$/, "Phone must contain only digits and optional +"),
    })
    .superRefine((data, ctx) => {
      if (!data.buyerId && !data.email) {
        ctx.addIssue({
          path: ["email"],
          code: z.ZodIssueCode.custom,
          message: "Either buyerId or email must be provided",
        });
      }
    }),
});
