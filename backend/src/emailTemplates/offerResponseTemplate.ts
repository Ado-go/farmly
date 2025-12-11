import { renderEmailLayout } from "./layout.ts";

type OfferResponseEmailParams = {
  offerTitle: string;
  senderEmail: string;
  message: string;
  sellerName?: string | null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const buildOfferResponseEmail = ({
  offerTitle,
  senderEmail,
  message,
  sellerName,
}: OfferResponseEmailParams) => {
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  const safeTitle = escapeHtml(offerTitle);
  const introName = sellerName ? `Ahoj ${escapeHtml(sellerName)},` : "Ahoj,";

  const content = `
    <p style="margin: 0 0 10px; color: #374151; line-height: 1.6;">${introName}</p>
    <p style="margin: 0 0 10px; color: #374151; line-height: 1.6;">
      Na tvoju ponuku <strong>${safeTitle}</strong> prišla nová reakcia od používateľa, ktorý sa chce spojiť cez e-mail.
    </p>
    <div style="margin: 14px 0; padding: 12px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;">
      <p style="margin: 0 0 6px; color: #111827; font-weight: 700;">Správa:</p>
      <p style="margin: 0; color: #374151; line-height: 1.6;">${safeMessage}</p>
    </div>
    <p style="margin: 0 0 10px; color: #374151; line-height: 1.6;">
      Odpovedz priamo na e-mail <a href="mailto:${encodeURIComponent(
        senderEmail
      )}" style="color: #16a34a; text-decoration: none;">${escapeHtml(
    senderEmail
  )}</a> a dohodnite sa na detailoch.
    </p>
    <p style="margin: 0; color: #6b7280; font-size: 13px;">Správa bola odoslaná cez formulár na Farmly.</p>
  `;

  return {
    subject: `Nová reakcia na ponuku "${offerTitle}"`,
    html: renderEmailLayout({
      title: "Nová reakcia na ponuku",
      intro: "Používateľ sa zaujíma o tvoju ponuku a poslal správu.",
      content,
    }),
  };
};
