import type { TFunction } from "i18next";
import { z } from "zod";

export const createFarmSchema = (t: TFunction) =>
  z.object({
    name: z.string().trim().min(1, { message: t("farmPage.validation.name") }),
    description: z.string().trim().optional(),
    city: z.string().trim().min(1, { message: t("farmPage.validation.city") }),
    street: z
      .string()
      .trim()
      .min(1, { message: t("farmPage.validation.street") }),
    region: z
      .string()
      .trim()
      .min(1, { message: t("farmPage.validation.region") }),
    postalCode: z
      .string()
      .trim()
      .min(1, { message: t("farmPage.validation.postalCode") }),
    country: z
      .string()
      .trim()
      .min(1, { message: t("farmPage.validation.country") }),
  });

export type FarmFormData = z.infer<ReturnType<typeof createFarmSchema>>;
