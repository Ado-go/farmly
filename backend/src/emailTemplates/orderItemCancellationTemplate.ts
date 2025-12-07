import { renderEmailLayout } from "./layout.ts";

type OrderItemCancellationParams = {
  orderNumber: string;
  itemName: string;
  quantity: number;
  unitPrice?: number;
  isPreorder?: boolean;
  reason?: string;
  remainingTotal?: number;
};

const formatEuro = (value: number) => `${value.toFixed(2)} €`;

export const buildOrderItemCancellationEmail = ({
  orderNumber,
  itemName,
  quantity,
  unitPrice,
  isPreorder = false,
  reason,
  remainingTotal,
}: OrderItemCancellationParams) => {
  const orderLabel = isPreorder ? "predobjednávke" : "objednávke";
  const orderTitle = isPreorder ? "Predobjednávka" : "Objednávka";

  const priceImpact =
    typeof unitPrice === "number"
      ? `<p style="margin: 0 0 10px; color: #374151; line-height: 1.6;">Z celkovej sumy odpočítavame <strong>${formatEuro(
          unitPrice * quantity
        )}</strong> (${quantity} × ${formatEuro(unitPrice)}).</p>`
      : "";

  const updatedTotal =
    typeof remainingTotal === "number"
      ? `<p style="margin: 0; color: #111827; font-weight: 700;">Aktuálna suma: ${formatEuro(remainingTotal)}</p>`
      : "";

  const content = `
    <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">
      V tvojej ${orderLabel} <strong>#${orderNumber}</strong> bola zrušená položka.
    </p>
    <div style="margin: 0 0 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb;">
      <p style="margin: 0; color: #111827; font-weight: 700;">${itemName}</p>
      <p style="margin: 4px 0 0; color: #6b7280;">Množstvo: ${quantity} ks</p>
      ${reason ? `<p style="margin: 8px 0 0; color: #374151;">Dôvod: ${reason}</p>` : ""}
      ${priceImpact}
      ${updatedTotal}
    </div>
    <p style="margin: 0; color: #374151; line-height: 1.6;">
      Najnovší stav ${orderTitle.toLowerCase()} nájdeš vo svojom profile. Ak potrebuješ pomôcť, stačí odpovedať na tento email.
    </p>
  `;

  return {
    subject: `${orderTitle} #${orderNumber} – položka bola zrušená`,
    html: renderEmailLayout({
      title: `${orderTitle} upravená`,
      intro: `Aktualizovali sme tvoju ${orderLabel} a odstránili jednu položku.`,
      content,
    }),
  };
};
