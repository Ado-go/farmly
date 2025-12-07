import { renderEmailLayout } from "./layout.ts";

type RegistrationEmailParams = {
  name?: string;
  dashboardUrl?: string;
};

export const buildRegistrationEmail = ({
  name,
  dashboardUrl,
}: RegistrationEmailParams) => {
  const greeting = name ? `${name}, vitaj vo Farmly!` : "Vitaj vo Farmly!";

  const cta = dashboardUrl
    ? `<a href="${dashboardUrl}" style="display: inline-block; margin-top: 6px; padding: 12px 18px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700;">Otvoriť Farmly</a>`
    : "";

  const content = `
    <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">${greeting}</p>
    <p style="margin: 0 0 14px; color: #374151; line-height: 1.6;">
      Tvoj účet bol vytvorený. Farmly spája farmárov, trhy a komunity, aby sa dobré jedlo dostalo bližšie k ľuďom.
    </p>
    <ul style="margin: 0 0 16px 18px; padding: 0; color: #374151; line-height: 1.6;">
      <li>Objavuj farmárov a udalosti vo svojom okolí.</li>
      <li>Vytváraj objednávky alebo predobjednávky v predstihu.</li>
      <li>Ulož si obľúbené farmy, aby si ich mal vždy po ruke.</li>
    </ul>
    ${cta}
  `;

  return {
    subject: "Vitaj vo Farmly",
    html: renderEmailLayout({
      title: "Vitaj vo Farmly",
      intro: "Sme radi, že si s nami. Tu je krátky prehľad toho, čo ťa čaká.",
      content,
    }),
  };
};
