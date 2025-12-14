import { renderEmailLayout } from "./layout.ts";

type PaymentMethod = "CARD" | "CASH";

type OrderItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

type DeliveryInfo = {
  deliveryStreet: string;
  deliveryCity: string;
  deliveryPostalCode: string;
  deliveryCountry: string;
};

const itemsTable = (items: OrderItem[]) =>
  items
    .map(
      (item) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">
            ${item.productName}
          </td>
          <td style="padding: 6px 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">
            ${item.quantity}×
          </td>
          <td style="padding: 6px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">
            ${item.unitPrice.toFixed(2)} €
          </td>
          <td style="padding: 6px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">
            ${(item.unitPrice * item.quantity).toFixed(2)} €
          </td>
        </tr>
      `
    )
    .join("");

const deliveryBlock = (delivery: DeliveryInfo) => {
  const streetLine = [delivery.deliveryStreet, delivery.deliveryCity]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");

  const cityLine = [delivery.deliveryPostalCode, delivery.deliveryCity]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  const lines = [
    streetLine || null,
    cityLine || null,
    delivery.deliveryCountry?.trim() || null,
  ].filter(Boolean);

  return `
  <h3 style="margin: 0 0 6px;">Miesto doručenia/prevzatia</h3>
  <p style="margin: 0 0 16px; line-height: 1.5;">
    ${lines.join("<br/>")}
  </p>
`;
};

export const buildOrderConfirmationEmail = ({
  orderNumber,
  totalPrice,
  delivery,
  items,
  paymentMethod,
  paymentLink,
}: {
  orderNumber: string;
  totalPrice: number;
  delivery: DeliveryInfo;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  paymentLink?: string;
}) => {
  const paymentLabel =
    paymentMethod === "CARD"
      ? "Platba kartou online"
      : "Platba v hotovosti";

  const payLinkHtml =
    paymentMethod === "CARD" && paymentLink
      ? `
      <p style="margin: 14px 0 10px; color: #374151;">Zaplať objednávku online, aby sme ju mohli rýchlejšie spracovať.</p>
      <a href="${paymentLink}"
        style="display: inline-block; padding: 12px 18px; background: #16a34a; color: #ffffff;
               text-decoration: none; border-radius: 10px; font-weight: 700;">
        Zaplatiť objednávku
      </a>
    `
      : `
      <p style="margin: 14px 0 0; color: #374151; line-height: 1.6;">Spôsob platby: <strong>${paymentLabel}</strong>. Zaplatíš pri prevzatí.</p>
    `;

  const content = `
    <p style="margin: 0 0 10px; color: #374151; line-height: 1.6;">Číslo objednávky: <strong>${orderNumber}</strong></p>
    <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Celková cena: <strong>${totalPrice.toFixed(
      2
    )} €</strong></p>
    ${deliveryBlock(delivery)}
    <h3 style="margin: 0 0 6px;">Položky objednávky</h3>
    <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 6px 8px; border-bottom: 1px solid #d1d5db;">Produkt</th>
          <th style="text-align: center; padding: 6px 8px; border-bottom: 1px solid #d1d5db;">Množstvo</th>
          <th style="text-align: right; padding: 6px 8px; border-bottom: 1px solid #d1d5db;">Cena/ks</th>
          <th style="text-align: right; padding: 6px 8px; border-bottom: 1px solid #d1d5db;">Spolu</th>
        </tr>
      </thead>
      <tbody>
        ${itemsTable(items)}
        <tr>
          <td colspan="3" style="padding: 10px 8px; text-align: right; font-weight: 700;">Celkom</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 700;">${totalPrice.toFixed(
            2
          )} €</td>
        </tr>
      </tbody>
    </table>
    <h3 style="margin: 18px 0 6px;">Spôsob platby</h3>
    <p style="margin: 0 0 6px;">${paymentLabel}</p>
    ${payLinkHtml}
  `;

  return {
    subject: "Vaša objednávka bola vytvorená",
    html: renderEmailLayout({
      title: "Objednávka vytvorená",
      intro: "Ďakujeme za objednávku. Tu je zhrnutie a pokyny k platbe.",
      content,
    }),
  };
};

export const buildPaymentSuccessEmail = ({
  orderNumber,
  totalPrice,
  delivery,
  items,
  paymentMethod,
}: {
  orderNumber: string;
  totalPrice: number;
  delivery: DeliveryInfo;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
}) => {
  const paymentLabel =
    paymentMethod === "CARD"
      ? "Platba kartou online"
      : "Platba v hotovosti";

  const content = `
    <p style="margin: 0 0 10px; color: #374151; line-height: 1.6;">Číslo objednávky: <strong>${orderNumber}</strong></p>
    <p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">Celková cena: <strong>${totalPrice.toFixed(
      2
    )} €</strong></p>

    ${deliveryBlock(delivery)}

    <h3 style="margin: 0 0 6px;">Zhrnutie objednávky</h3>
    <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 6px 8px; border-bottom: 1px solid #d1d5db;">Produkt</th>
          <th style="text-align: center; padding: 6px 8px; border-bottom: 1px solid #d1d5db;">Množstvo</th>
          <th style="text-align: right; padding: 6px 8px; border-bottom: 1px solid #d1d5db;">Cena/ks</th>
          <th style="text-align: right; padding: 6px 8px; border-bottom: 1px solid #d1d5db;">Spolu</th>
        </tr>
      </thead>
      <tbody>
        ${itemsTable(items)}
        <tr>
          <td colspan="3" style="padding: 10px 8px; text-align: right; font-weight: 700;">Celkom</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 700;">${totalPrice.toFixed(
            2
          )} €</td>
        </tr>
      </tbody>
    </table>

    <h3 style="margin: 18px 0 6px;">Spôsob platby</h3>
    <p style="margin: 0 0 6px;">${paymentLabel}</p>
    <p style="margin: 12px 0 0; color: #374151; line-height: 1.6;">Ďakujeme za platbu. Objednávka je označená ako zaplatená.</p>
  `;

  return {
    subject: "Platba bola potvrdená",
    html: renderEmailLayout({
      title: "Platba bola potvrdená",
      intro: "Platba prebehla úspešne. Tu je potvrdenie a zhrnutie objednávky.",
      content,
    }),
  };
};
