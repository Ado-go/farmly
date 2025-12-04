import { z } from "zod";

export const addressSchema = z.object({
  contactName: z.string().min(2, "Name is required"),
  contactPhone: z
    .string()
    .min(6, "Phone number must have at least 6 digits")
    .regex(/^\+?\d{6,15}$/, "Enter a valid phone number"),
  email: z.string().email(),
  deliveryOption: z.enum(["ADDRESS", "PICKUP"]),
  deliveryCity: z.string().min(2, "City required"),
  deliveryStreet: z.string().optional(),
  deliveryPostalCode: z.string().min(2, "Postal code required"),
  deliveryCountry: z.string().min(2, "Country required"),
});

export const paymentSchema = z.object({
  paymentMethod: z.enum(["CASH", "CARD"]),
});

export type AddressData = z.infer<typeof addressSchema>;
export type PaymentData = z.infer<typeof paymentSchema>;
export type DeliveryOption = AddressData["deliveryOption"];
export type PaymentMethod = PaymentData["paymentMethod"];
