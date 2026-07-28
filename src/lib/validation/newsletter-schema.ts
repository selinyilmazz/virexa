import { z } from "zod";
import type { TFunction } from "@/i18n/translate";

/**
 * Validates the homepage newsletter signup form's one field before it's
 * sent to `POST /api/newsletter/subscribe`. Same `createXSchema(t)`
 * factory shape as `createProfileSchema` - localized per-field messages,
 * built fresh where `t` is already in scope (`NewsletterSection`'s submit
 * handler).
 */
export function createNewsletterSubscribeSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, t("validation.newsletter.emailRequired"))
      .max(254, t("validation.newsletter.emailMax"))
      .email(t("validation.newsletter.emailInvalid")),
  });
}

export type NewsletterSubscribeFormValues = z.infer<ReturnType<typeof createNewsletterSubscribeSchema>>;
