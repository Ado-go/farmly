import { renderEmailLayout } from "./layout.ts";

type OrderCancellationEmailParams = {
  orderNumber: string;
  isPreorder?: boolean;
  refundAmount?: number;
  reason?: string;
  supportEmail?: string;
};

const formatEuro = (value: number) => `${value.toFixed(2)} €`;

export const buildOrderCancellationEmail = ({
  orderNumber,
  isPreorder = false,
  refundAmount,
  reason,
  supportEmail = "support@farmly.sk",
}: OrderCancellationEmailParams) => {
  const orderTitle = isPreorder ? "Predobjednávka" : "Objednávka";
  const orderLabel = isPreorder ? "predobjednávku" : "objednávku";

  const refundBlock =
    typeof refundAmount === "number"
      ? `<p style="margin: 0 0 10px; color: #374151; line-height: 1.6;">Vraciame sumu <strong>${formatEuro(
          refundAmount
        )}</strong> rovnakým spôsobom, akým prebehla platba.</p>`
      : "";

  const content = `
    <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">
      ${orderTitle} <strong>#${orderNumber}</strong> bola zrušená.
    </p>
    ${reason ? `<p style="margin: 0 0 10px; color: #374151; line-height: 1.6;">Dôvod: ${reason}</p>` : ""}
    ${refundBlock}
    <p style="margin: 0; color: #374151; line-height: 1.6;">Ak máš otázky, odpovedz na tento email alebo napíš na <a href="mailto:${supportEmail}" style="color: #16a34a; text-decoration: none;">${supportEmail}</a>.</p>
  `;

  return {
    subject: `${orderTitle} #${orderNumber} bola zrušená`,
    html: renderEmailLayout({
      title: `${orderTitle} zrušená`,
      intro: `Potvrdzujeme, že sme zrušili tvoju ${orderLabel}.`,
      content,
    }),
  };
};
