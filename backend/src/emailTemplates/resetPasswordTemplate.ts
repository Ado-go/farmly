import { renderEmailLayout } from "./layout.ts";

export const buildResetPasswordEmail = (resetLink: string) => {
  const content = `
    <p style="margin: 0 0 10px; color: #374151; line-height: 1.6;">
      Požiadali ste o reset hesla. Odkaz je platný 15 minút:
    </p>
    <a href="${resetLink}" target="_blank" style="display: inline-block; margin: 10px 0 16px; padding: 12px 18px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700;">
      Obnoviť heslo
    </a>
    <p style="margin: 0; color: #6b7280; line-height: 1.6;">
      Ak ste reset nepožiadali, ignorujte tento email.
    </p>
  `;

  return {
    subject: "Resetovanie hesla",
    html: renderEmailLayout({
      title: "Reset hesla",
      intro: "Odkaz nižšie vám umožní nastaviť nové heslo.",
      content,
    }),
  };
};
