import { renderEmailLayout } from "./layout.ts";

type AccountDeletionEmailParams = {
  name?: string;
  deletionDate?: string;
  supportEmail?: string;
};

export const buildAccountDeletionEmail = ({
  name,
  deletionDate,
  supportEmail = "support@farmly.sk",
}: AccountDeletionEmailParams) => {
  const intro = name
    ? `${name}, tvoj účet na Farmly bol odstránený.`
    : "Tvoj účet na Farmly bol odstránený.";

  const content = `
    <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">${intro}</p>
    <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">
      ${deletionDate ? `Zrušenie sme spracovali ${deletionDate}.` : "Zrušenie sme spracovali."} Všetky tvoje dáta spojené s účtom boli odstránené alebo anonymizované podľa našich zásad.
    </p>
    <p style="margin: 0 0 12px; color: #374151; line-height: 1.6;">Ak si si tento krok nerozmyslel, radi ťa uvidíme späť kedykoľvek v budúcnosti.</p>
    <p style="margin: 16px 0 0; color: #6b7280; line-height: 1.6;">
      Otázky alebo pochybnosti? Napíš nám na <a href="mailto:${supportEmail}" style="color: #16a34a; text-decoration: none;">${supportEmail}</a> a pomôžeme ti.
    </p>
  `;

  return {
    subject: "Potvrdenie zmazania účtu",
    html: renderEmailLayout({
      title: "Účet bol zmazaný",
      intro: "Je nám ľúto, že odchádzaš. Tvoje údaje boli odstránené.",
      content,
    }),
  };
};
