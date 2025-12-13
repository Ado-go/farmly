import type { TFunction } from "i18next";
import { z } from "zod";

export const createAddressSchema = (t: TFunction) =>
  z.object({
    contactName: z
      .string()
      .trim()
      .min(1, t("checkoutPage.errors.contactNameRequired")),
    contactPhone: z
      .string()
      .trim()
      .min(1, t("checkoutPage.errors.contactPhoneRequired"))
      .regex(/^\+?\d{6,15}$/, t("checkoutPage.errors.contactPhoneInvalid")),
    email: z
      .string()
      .trim()
      .email(t("checkoutPage.errors.emailInvalid")),
    deliveryOption: z.enum(["ADDRESS", "PICKUP"]),
    deliveryCity: z
      .string()
      .trim()
      .min(1, t("checkoutPage.errors.deliveryCityRequired")),
    deliveryStreet: z
      .string()
      .trim()
      .min(1, t("checkoutPage.errors.deliveryStreetRequired")),
    deliveryPostalCode: z
      .string()
      .trim()
      .min(1, t("checkoutPage.errors.deliveryPostalCodeRequired")),
    deliveryCountry: z
      .string()
      .trim()
      .min(1, t("checkoutPage.errors.deliveryCountryRequired")),
  });

export const paymentSchema = z.object({
  paymentMethod: z.enum(["CASH", "CARD"]),
});

export const createPreorderSchema = (t: TFunction) =>
  z.object({
    contactName: z
      .string()
      .trim()
      .min(1, t("checkoutPreoderPage.contactNameRequired")),
    contactPhone: z
      .string()
      .trim()
      .min(1, t("checkoutPreoderPage.contactPhoneRequired"))
      .regex(/^\+?\d{6,15}$/, t("checkoutPreoderPage.contactPhoneInvalid")),
    email: z
      .string()
      .trim()
      .min(1, t("checkoutPreoderPage.contactEmailRequired"))
      .email(t("checkoutPreoderPage.contactEmailInvalid")),
  });

export type AddressData = z.infer<ReturnType<typeof createAddressSchema>>;
export type PaymentData = z.infer<typeof paymentSchema>;
export type DeliveryOption = AddressData["deliveryOption"];
export type PaymentMethod = PaymentData["paymentMethod"];
export type PreorderFormValues = z.infer<ReturnType<typeof createPreorderSchema>>;
