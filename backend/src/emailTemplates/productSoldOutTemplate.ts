import { renderEmailLayout } from "./layout.ts";

type ProductSoldOutParams = {
  productName: string;
  farmerName?: string;
  isPreorder?: boolean;
  eventTitle?: string;
};

export const buildProductSoldOutEmail = ({
  productName,
  farmerName,
  isPreorder = false,
  eventTitle,
}: ProductSoldOutParams) => {
  const subject = `Produkt ${productName} je vypredaný`;
  const orderLabel = isPreorder ? "predobjednávok" : "objednávok";
  const eventLine = eventTitle
    ? `<p style="margin: 6px 0 0; color: #374151;">Udalosť: <strong>${eventTitle}</strong></p>`
    : "";

  const content = `
    <p style="margin: 0 0 10px; color: #374151;">
      ${farmerName ? `Ahoj ${farmerName},` : "Ahoj,"}
    </p>
    <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">
      produkt <strong>${productName}</strong> sa práve vypredal a jeho sklad je na nule.
    </p>
    ${eventLine}
    <div style="margin: 12px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb;">
      <p style="margin: 0 0 6px; color: #111827; font-weight: 700;">Čo ďalej?</p>
      <ul style="margin: 0; padding-left: 18px; color: #4b5563; line-height: 1.6;">
        <li>Doplň sklad, ak máš k dispozícii ďalší tovar.</li>
        <li>Ak vieš, že tovar nebude, nechaj produkt viditeľný ako vypredaný, aby zákazníci vedeli, že bol obľúbený.</li>
      </ul>
    </div>
    <p style="margin: 8px 0 0; color: #6b7280;">Oznámenie sme poslali, aby si vedel, že ďalšie ${orderLabel} na tento produkt už nepôjde prijať.</p>
  `;

  return {
    subject,
    html: renderEmailLayout({
      title: "Produkt vypredaný",
      intro: "Dávame ti vedieť, že zásoba produktu je na nule.",
      content,
    }),
  };
};
