import { renderEmailLayout } from "./layout.ts";

type PreorderItem = {
  name: string;
  quantity: number;
  unitPrice?: number;
};

type PreorderCreatedEmailParams = {
  orderNumber: string;
  eventTitle?: string;
  pickupInfo?: string;
  items?: PreorderItem[];
  totalPrice?: number;
};

const formatEuro = (value: number) => `${value.toFixed(2)} €`;

const renderItemsTable = (items: PreorderItem[]) => {
  if (!items.length) return "";

  const hasPrices = items.some((item) => typeof item.unitPrice === "number");
  const subtotal = hasPrices
    ? formatEuro(
        items.reduce(
          (sum, item) =>
            sum +
            (typeof item.unitPrice === "number"
              ? item.unitPrice * item.quantity
              : 0),
          0
        )
      )
    : null;

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
          <td style="padding: 6px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${itemTotal || ""}</td>
        </tr>
      `;
    })
    .join("");

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
        ${hasPrices ? `<tr>
          <td colspan="3" style="padding: 10px 8px; text-align: right; font-weight: 700;">Medzisúčet</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 700;">${subtotal ?? ""}</td>
        </tr>` : ""}
      </tbody>
    </table>
  `;
};

export const buildPreorderCreatedEmail = ({
  orderNumber,
  eventTitle,
  pickupInfo,
  items = [],
  totalPrice,
}: PreorderCreatedEmailParams) => {
  const summaryBlock = items.length ? renderItemsTable(items) : "";

  const totalBlock =
    typeof totalPrice === "number"
      ? `<p style="margin: 10px 0 0; color: #111827; font-weight: 700;">Celková cena: ${formatEuro(
          totalPrice
        )}</p>`
      : "";

  const content = `
    <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">
      Tvoja predobjednávka <strong>#${orderNumber}</strong> bola vytvorená.
    </p>
    ${eventTitle ? `<p style="margin: 0 0 8px; color: #374151;">Udalosť: <strong>${eventTitle}</strong></p>` : ""}
    ${pickupInfo ? `<p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">Miesto/čas prevzatia: ${pickupInfo}</p>` : ""}
    ${summaryBlock}
    ${totalBlock}
    <p style="margin: 12px 0 0; color: #374151; line-height: 1.6;">Podrobnosti nájdeš vo svojom profile. Stačí odpovedať na tento email, ak potrebuješ niečo upraviť.</p>
  `;

  return {
    subject: "Predobjednávka bola vytvorená",
    html: renderEmailLayout({
      title: "Predobjednávka vytvorená",
      intro: "Ďakujeme, že plánuješ dopredu. Potvrdzujeme vytvorenie predobjednávky.",
      content,
    }),
  };
};
