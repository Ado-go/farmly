import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { EventOrder, Order } from "@/types/orders";

type Translator = (key: string, options?: Record<string, unknown>) => string;
type OrderType = "STANDARD" | "PREORDER" | string | undefined;

type AnyOrder = Order | EventOrder;

type DownloadOptions = {
  order: AnyOrder;
  t: Translator;
  type?: OrderType;
};

const CURRENCY = "€";
const DEFAULT_FONT = "times";

export async function downloadOrderPdf({ order, t, type }: DownloadOptions) {
  const doc = new jsPDF();
  const fontKey = DEFAULT_FONT;

  const kind: OrderType = type ?? order.orderType;
  const isPreorder = (kind ?? "").toUpperCase() === "PREORDER";

  let cursorY = 18;

  doc.setFont(fontKey, "normal");
  doc.setFontSize(16);
  doc.text(
    cleanText(`${t("ordersPage.order")} #${order.orderNumber}`),
    14,
    cursorY
  );

  doc.setFontSize(11);
  cursorY += 10;
  doc.text(
    cleanText(`${t("ordersPage.total")}: ${formatPrice(order.totalPrice)}`),
    14,
    cursorY
  );

  if (order.paymentMethod) {
    cursorY += 6;
    doc.text(
      cleanText(
        `${t("ordersPage.paymentLabel")}: ${getPaymentLabel(
          order.paymentMethod,
          t
        )}`
      ),
      14,
      cursorY
    );
  }

  if (isPreorder) {
    const eventLines = getEventLines(order as EventOrder, t);
    if (eventLines.length) {
      cursorY += 10;
      cursorY = writeSection(
        doc,
        t("ordersPage.pickupTitle"),
        eventLines,
        cursorY
      );
    }
  } else {
    const deliveryLines = getDeliveryLines(order, t);
    cursorY += 10;
    cursorY = writeSection(
      doc,
      t("ordersPage.deliveryTitle"),
      deliveryLines,
      cursorY
    );
  }

  const contactLines = getContactLines(order, t);
  cursorY += 8;
  cursorY = writeSection(
    doc,
    t("ordersPage.contactTitle"),
    contactLines,
    cursorY
  );

  const items = order.items ?? [];
  const rows = items.map((item) => [
    cleanText(item.productName),
    formatNumber(item.quantity),
    formatPrice(item.unitPrice),
    formatPrice(item.unitPrice * item.quantity),
  ]);

  autoTable(doc, {
    startY: cursorY + 6,
    head: [
      [
        cleanText(t("ordersPage.pdfProduct")),
        cleanText(t("ordersPage.pdfQuantity")),
        cleanText(t("ordersPage.pdfUnitPrice")),
        cleanText(t("ordersPage.pdfSubtotal")),
      ],
    ],
    body: rows,
    styles: {
      font: fontKey,
      fontSize: 9.5,
      halign: "left",
      cellPadding: { top: 4, bottom: 3, left: 3, right: 3 },
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: 255,
      fontStyle: "bold",
    },
    bodyStyles: { lineColor: [226, 232, 240], lineWidth: 0.2 },
    alternateRowStyles: { fillColor: [247, 250, 252] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
    },
    theme: "grid",
    foot: [
      [
        {
          content: cleanText(t("ordersPage.total")),
          colSpan: 3,
          styles: { halign: "right" },
        },
        formatPrice(order.totalPrice),
      ],
    ],
    footStyles: {
      fontStyle: "bold",
      fillColor: [15, 118, 110],
      textColor: 255,
    },
    margin: { left: 14, right: 14 },
    tableWidth: "auto",
  });

  doc.save(`order-${order.orderNumber}.pdf`);
}

function writeSection(
  doc: jsPDF,
  title: string,
  lines: string[],
  startY: number
) {
  if (!lines.length) return startY;

  doc.setFontSize(12);
  doc.text(cleanText(title), 14, startY);
  doc.setFontSize(10);

  let nextY = startY + 6;
  lines.forEach((line) => {
    doc.text(cleanText(line), 16, nextY);
    nextY += 5;
  });

  return nextY;
}

function getDeliveryLines(order: AnyOrder, t: Translator) {
  const delivery = [
    order.delivery?.street,
    [order.delivery?.city, order.delivery?.postalCode]
      .filter(Boolean)
      .join(" "),
    order.delivery?.country,
  ].filter(Boolean) as string[];

  return delivery.length ? delivery : [t("ordersPage.deliveryUnknown")];
}

function getEventLines(order: EventOrder, t: Translator) {
  const { event } = order;
  if (!event) return [t("ordersPage.preorderDateUnknown")];

  const lines = [
    event.title,
    formatPreorderDate(event.startDate, event.endDate, t),
    event.street,
    [event.city, event.postalCode].filter(Boolean).join(" "),
    event.country,
  ].filter(Boolean) as string[];

  return lines.length ? lines : [t("ordersPage.preorderDateUnknown")];
}

function getContactLines(order: AnyOrder, t: Translator) {
  const lines = [
    order.contact?.name ?? order.buyer?.name ?? null,
    order.contact?.phone ?? order.buyer?.phone ?? null,
    order.contact?.email ?? order.buyer?.email ?? null,
  ].filter(Boolean) as string[];

  return lines.length ? lines : [t("ordersPage.contactUnknown")];
}

function formatPreorderDate(
  startDate: string | undefined,
  endDate: string | undefined,
  t: Translator
) {
  if (!startDate) return t("ordersPage.preorderDateUnknown");

  const formatter = new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const start = formatter.format(new Date(startDate));
  const end = endDate ? formatter.format(new Date(endDate)) : null;
  const dateLabel = end && end !== start ? `${start} – ${end}` : start;

  return t("ordersPage.preorderDateLabel", { date: dateLabel });
}

const numberFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatPrice(value: number | null | undefined) {
  const num = typeof value === "number" ? value : 0;
  return `${numberFormatter.format(num)} ${CURRENCY}`;
}

function formatNumber(value: number | null | undefined) {
  const num = typeof value === "number" ? value : 0;
  return integerFormatter.format(num);
}

function getPaymentLabel(method: string | undefined, t: Translator) {
  if (!method) return t("ordersPage.paymentUnknown");

  const map: Record<string, string> = {
    CASH: t("ordersPage.paymentMethod.cash"),
    CARD: t("ordersPage.paymentMethod.card"),
  };

  return map[method] ?? t("ordersPage.paymentUnknown");
}

function cleanText(value: string | number | null | undefined) {
  const str = value == null ? "" : String(value);
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
