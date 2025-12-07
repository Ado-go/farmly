import { renderEmailLayout } from "./layout.ts";

type FarmerOrderItem = {
  name: string;
  quantity: number;
  unitPrice?: number;
};

type FarmerOrderNotificationParams = {
  orderNumber: string;
  isPreorder?: boolean;
  eventTitle?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items?: FarmerOrderItem[];
  totalPrice?: number;
  pickupInfo?: string;
  deliveryInfo?: string;
  paymentMethod?: "CARD" | "CASH";
};

const formatEuro = (value: number) => `${value.toFixed(2)} €`;

const renderItemsTable = (items: FarmerOrderItem[]) => {
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
          <td style="padding: 6px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">${itemTotal}</td>
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
          <td style="padding: 10px 8px; text-align: right; font-weight: 700;">${subtotal}</td>
        </tr>` : ""}
      </tbody>
    </table>
  `;
};

export const buildFarmerOrderNotificationEmail = ({
  orderNumber,
  isPreorder = false,
  eventTitle,
  customerName,
  customerEmail,
  customerPhone,
  items = [],
  totalPrice,
  pickupInfo,
  deliveryInfo,
  paymentMethod,
}: FarmerOrderNotificationParams) => {
  const orderTitle = isPreorder ? "Predobjednávka" : "Objednávka";
  const orderLabel = isPreorder ? "predobjednávku" : "objednávku";
  const paymentLabel =
    paymentMethod === "CARD"
      ? "Kartou (online)"
      : paymentMethod === "CASH"
      ? "Hotovosť pri prevzatí"
      : undefined;

  const customerBlock =
    customerName || customerEmail || customerPhone
      ? `
    <div style="margin: 12px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f9fafb;">
      <p style="margin: 0; color: #111827; font-weight: 700;">Kontakt zákazníka</p>
      ${customerName ? `<p style="margin: 6px 0 0; color: #374151;">${customerName}</p>` : ""}
      ${customerEmail ? `<p style="margin: 4px 0 0; color: #374151;"><a href="mailto:${customerEmail}" style="color: #16a34a; text-decoration: none;">${customerEmail}</a></p>` : ""}
      ${customerPhone ? `<p style="margin: 4px 0 0; color: #374151;"><a href="tel:${customerPhone}" style="color: #16a34a; text-decoration: none;">${customerPhone}</a></p>` : ""}
    </div>
    `
      : "";

  const deliveryBlock =
    pickupInfo || deliveryInfo
      ? `
    <div style="margin: 12px 0; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fdfcfb;">
      <p style="margin: 0; color: #111827; font-weight: 700;">Prevzatie</p>
      ${pickupInfo ? `<p style="margin: 6px 0 0; color: #374151;">${pickupInfo}</p>` : ""}
      ${deliveryInfo ? `<p style="margin: 6px 0 0; color: #374151;">Doručenie: ${deliveryInfo}</p>` : ""}
    </div>
    `
      : "";

  const itemsBlock = items.length ? renderItemsTable(items) : "";

  const totalBlock =
    typeof totalPrice === "number"
      ? `<p style="margin: 12px 0 0; color: #111827; font-weight: 700;">Celková suma pre túto ${
          isPreorder ? "predobjednávku" : "objednávku"
        }: ${formatEuro(totalPrice)}</p>`
      : "";

  const paymentBlock = paymentLabel
    ? `<p style="margin: 8px 0 0; color: #374151;">Spôsob platby: <strong>${paymentLabel}</strong></p>`
    : "";

  const content = `
    <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">
      Máš novú ${orderLabel} na Farmly. Pozri si zhrnutie nižšie.
    </p>
    <div style="margin: 0 0 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #ffffff;">
      <p style="margin: 0; color: #111827; font-weight: 700;">${orderTitle} #${orderNumber}</p>
      ${eventTitle ? `<p style="margin: 6px 0 0; color: #374151;">Udalosť: ${eventTitle}</p>` : ""}
      ${paymentBlock}
    </div>
    ${customerBlock}
    ${deliveryBlock}
    ${itemsBlock}
    ${totalBlock}
    <p style="margin: 16px 0 0; color: #6b7280; line-height: 1.6;">Tip: skontroluj sklad a potvrď dostupnosť, aby mal zákazník istotu.</p>
  `;

  return {
    subject: `${orderTitle} #${orderNumber} – nová pre teba`,
    html: renderEmailLayout({
      title: `${orderTitle} pre tvoju farmu`,
      intro: "Dávame ti vedieť, že pribudla nová požiadavka od zákazníka.",
      content,
    }),
  };
};
