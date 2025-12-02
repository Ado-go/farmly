import { z } from "zod";

export const checkoutSchema = z.object({
  cartItems: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive("Quantity must be at least 1"),
        unitPrice: z.number().min(0),
        productName: z.string().min(1),
        sellerName: z.string().min(1),
      })
    )
    .min(1, "Cart cannot be empty"),

  userInfo: z
    .object({
      buyerId: z.number().int().positive().optional(),
      email: z.string().email("Invalid email address").optional(),
      contactName: z.string().min(2, "Name must be at least 2 characters"),
      contactPhone: z
        .string()
        .min(6, "Phone must have at least 6 digits")
        .regex(/^\+?\d{6,15}$/, "Phone must contain only digits and optional +"),

      deliveryCity: z.string().min(2).max(100),
      deliveryStreet: z.string().min(2).max(150),
      deliveryPostalCode: z.string().min(3).max(20),
      deliveryCountry: z.string().min(2).max(100),

      paymentMethod: z.enum(["CARD", "CASH"]),
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
