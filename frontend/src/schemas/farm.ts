import type { TFunction } from "i18next";
import { z } from "zod";

export const createFarmSchema = (t: TFunction) =>
  z.object({
    name: z.string().min(2, { message: t("farmPage.validation.name") }),
    description: z.string().optional(),
    city: z.string().min(2, { message: t("farmPage.validation.city") }),
    street: z.string().min(2, { message: t("farmPage.validation.street") }),
    region: z.string().min(2, { message: t("farmPage.validation.region") }),
    postalCode: z
      .string()
      .min(2, { message: t("farmPage.validation.postalCode") }),
    country: z.string().min(2, { message: t("farmPage.validation.country") }),
  });

export type FarmFormData = z.infer<ReturnType<typeof createFarmSchema>>;
