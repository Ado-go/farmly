import { renderEmailLayout } from "./layout.ts";

type PasswordChangedEmailParams = {
  name?: string;
  loginUrl?: string;
  supportEmail?: string;
};

export const buildPasswordChangedEmail = ({
  name,
  loginUrl,
  supportEmail = "support@farmly.sk",
}: PasswordChangedEmailParams) => {
  const greeting = name ? `${name}, tvoje heslo bolo zmenené.` : "Tvoje heslo bolo zmenené.";

  const cta = loginUrl
    ? `<a href="${loginUrl}" style="display: inline-block; margin-top: 10px; padding: 12px 18px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700;">Prihlásiť sa</a>`
    : "";

  const content = `
    <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">${greeting}</p>
    <p style="margin: 0 0 10px; color: #374151; line-height: 1.6;">Bezpečnosť berieme vážne. Ak si túto zmenu neurobil, okamžite kontaktuj náš tím.</p>
    <p style="margin: 0 0 10px; color: #374151; line-height: 1.6;">
      Ak si to bol ty, môžeš sa prihlásiť s novým heslom a pokračovať v objavovaní Farmly.
    </p>
    ${cta}
    <p style="margin: 16px 0 0; color: #6b7280; line-height: 1.6;">
      Potrebuješ pomôcť? Napíš nám na <a href="mailto:${supportEmail}" style="color: #16a34a; text-decoration: none;">${supportEmail}</a>.
    </p>
  `;

  return {
    subject: "Heslo na Farmly bolo zmenené",
    html: renderEmailLayout({
      title: "Heslo bolo zmenené",
      intro: "Potvrdzujeme úspešnú aktualizáciu tvojho hesla.",
      content,
    }),
  };
};
