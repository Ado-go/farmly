import { z } from "zod";

export const checkoutSchema = z.object({
  cartItems: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive("Quantity must be at least 1"),
        unitPrice: z.number().min(0),
        productName: z.string().trim().min(1, "Product name is required"),
        sellerName: z.string().trim().min(1, "Seller name is required"),
      })
    )
    .min(1, "Cart cannot be empty"),

  userInfo: z
    .object({
      buyerId: z.number().int().positive().optional(),
      email: z.string().trim().email("Invalid email address").optional(),
      contactName: z.string().trim().min(1, "Name is required"),
      contactPhone: z
        .string()
        .trim()
        .min(1, "Phone is required")
        .regex(/^\+?\d{6,15}$/, "Phone must contain 6-15 digits and optional +"),

      deliveryCity: z.string().trim().min(1, "City is required").max(100),
      deliveryStreet: z.string().trim().min(1, "Street is required").max(150),
      deliveryPostalCode: z
        .string()
        .trim()
        .min(1, "Postal code is required")
        .max(20),
      deliveryCountry: z.string().trim().min(1, "Country is required").max(100),

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
