import type { TFunction } from "i18next";
import { z } from "zod";

const dateField = (t: TFunction, msgKey: string) =>
  z
    .any()
    .refine(
      (val) => val instanceof Date && !Number.isNaN((val as Date).getTime()),
      { message: t(msgKey) }
    )
    .transform((val) => val as Date);

export const buildEventSchema = (t: TFunction) =>
  z.object({
    title: z.string().trim().min(1, t("eventPage.errors.title")),
    description: z.string().trim().optional(),
    startDate: dateField(t, "eventPage.errors.startDate"),
    endDate: dateField(t, "eventPage.errors.endDate"),
    city: z.string().trim().min(1, t("eventPage.errors.city")),
    street: z.string().trim().min(1, t("eventPage.errors.street")),
    region: z.string().trim().min(1, t("eventPage.errors.region")),
    postalCode: z.string().trim().min(1, t("eventPage.errors.postalCode")),
    country: z.string().trim().min(1, t("eventPage.errors.country")),
  });

export type EventFormData = z.infer<ReturnType<typeof buildEventSchema>>;
