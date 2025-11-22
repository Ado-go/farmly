type PaymentMethod = "CARD" | "CASH" | "BANK_TRANSFER";

type OrderItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
};

type DeliveryInfo = {
  deliveryStreet: string;
  deliveryCity: string;
  deliveryRegion: string;
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

const deliveryBlock = (delivery: DeliveryInfo) => `
  <h3 style="margin: 0 0 6px;">Dodacia adresa</h3>
  <p style="margin: 0 0 16px; line-height: 1.5;">
    ${delivery.deliveryStreet}, ${delivery.deliveryCity}<br/>
    ${delivery.deliveryRegion}, ${delivery.deliveryPostalCode}<br/>
    ${delivery.deliveryCountry}
  </p>
`;

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
    paymentMethod === "CARD" ? "Platba kartou" : "Platba v hotovosti";

  const payLinkHtml =
    paymentMethod === "CARD" && paymentLink
      ? `
    <p style="margin-top: 18px;">Kliknite nižšie a zaplaťte objednávku:</p>
    <a href="${paymentLink}"
      style="display: inline-block; padding: 10px 18px; background: #34d399; color: #fff;
             text-decoration: none; border-radius: 6px; font-weight: 600;">
      Zaplatiť objednávku
    </a>
  `
      : `
    <p style="margin-top: 18px;">Spôsob platby: <strong>${paymentLabel}</strong>. Zaplatíte pri prevzatí.</p>
  `;

  return {
    subject: "Vaša objednávka bola vytvorená",
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2 style="color: #16a34a; margin-bottom: 8px;">Ďakujeme za objednávku!</h2>
        <p style="margin: 0 0 8px;">Číslo objednávky: <strong>${orderNumber}</strong></p>
        <p style="margin: 0 0 16px;">Celková cena: <strong>${totalPrice.toFixed(
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
      </div>
    `,
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
    paymentMethod === "CARD" ? "Platba kartou" : "Platba v hotovosti";

  return {
    subject: "Platba bola potvrdená",
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2 style="color: #16a34a; margin-bottom: 8px;">Platba bola potvrdená 🎉</h2>
        <p style="margin: 0 0 8px;">Číslo objednávky: <strong>${orderNumber}</strong></p>
        <p style="margin: 0 0 16px;">Celková cena: <strong>${totalPrice.toFixed(
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
        <p style="margin: 12px 0 0;">Ďakujeme za vašu platbu. Objednávka je označená ako zaplatená.</p>
      </div>
    `,
  };
};
