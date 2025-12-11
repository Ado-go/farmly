import { renderEmailLayout } from "./layout.ts";

type FarmerOrderItem = {
  name: string;
  quantity: number;
  unitPrice?: number;
};

type FarmerOrderCancellationParams = {
  orderNumber: string;
  isPreorder?: boolean;
  eventTitle?: string;
  items?: FarmerOrderItem[];
  totalPrice?: number;
  reason?: string;
};

const formatEuro = (value: number) => `${value.toFixed(2)} €`;

const renderItemsTable = (items: FarmerOrderItem[]) => {
  if (!items.length) return "";

  const hasPrices = items.some((item) => typeof item.unitPrice === "number");

  const rows = items
    .map((item) => {
      const itemTotal =
        hasPrices && typeof item.unitPrice === "number"
          ? formatEuro(item.unitPrice * item.quantity)
          : "";

      return `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
          <td style="padding: 6px 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">${item.quantity}×</td>
          <td style="padding: 6px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${
            hasPrices && typeof item.unitPrice === "number"
              ? formatEuro(item.unitPrice)
              : "—"
          }</td>
          <td style="padding: 6px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${itemTotal}</td>
        </tr>
      `;
    })
    .join("");

  const subtotal =
    hasPrices &&
    formatEuro(
      items.reduce(
        (sum, item) =>
          sum +
          (typeof item.unitPrice === "number"
            ? item.unitPrice * item.quantity
            : 0),
        0
      )
    );

  return `
    <table style="border-collapse: collapse; width: 100%; font-size: 14px; margin: 10px 0 0;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 6px 8px; border-bottom: 1px solid #d1d5db;">Produkt</th>
          <th style="text-align: center; padding: 6px 8px; border-bottom: 1px solid #d1d5db;">Množstvo</th>
          <th style="text-align: right; padding: 6px 8px; border-bottom: 1px solid #d1d5db;">Cena/ks</th>
          <th style="text-align: right; padding: 6px 8px; border-bottom: 1px solid #d1d5db;">Spolu</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        ${
          subtotal
            ? `<tr>
          <td colspan="3" style="padding: 10px 8px; text-align: right; font-weight: 700;">Medzisúčet</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 700;">${subtotal}</td>
        </tr>`
            : ""
        }
      </tbody>
    </table>
  `;
};

export const buildFarmerOrderCancellationEmail = ({
  orderNumber,
  isPreorder = false,
  eventTitle,
  items = [],
  totalPrice,
  reason,
}: FarmerOrderCancellationParams) => {
  const orderTitle = isPreorder ? "Predobjednávka" : "Objednávka";
  const cancellationReason = reason
    ? `<p style="margin: 0 0 10px; color: #374151; line-height: 1.6;">Dôvod: ${reason}</p>`
    : "";

  const totalBlock =
    typeof totalPrice === "number"
      ? `<p style="margin: 12px 0 0; color: #111827; font-weight: 700;">Suma pre tvoje položky: ${formatEuro(
          totalPrice
        )}</p>`
      : "";

  const content = `
    <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">
      ${orderTitle} <strong>#${orderNumber}</strong> bola zrušená.
    </p>
    ${eventTitle ? `<p style="margin: 0 0 10px; color: #374151;">Udalosť: ${eventTitle}</p>` : ""}
    ${cancellationReason}
    ${items.length ? renderItemsTable(items) : ""}
    ${totalBlock}
    <p style="margin: 16px 0 0; color: #6b7280; line-height: 1.6;">Aktualizuj si stav dostupnosti podľa potreby.</p>
  `;

  return {
    subject: `${orderTitle} #${orderNumber} – zrušená`,
    html: renderEmailLayout({
      title: `${orderTitle} zrušená`,
      intro: "Zákazník alebo organizátor zrušil objednávku/predobjednávku.",
      content,
    }),
  };
};
