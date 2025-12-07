type EmailLayoutOptions = {
  title: string;
  intro?: string;
  content: string;
  footerNote?: string;
  accentColor?: string;
};

export const renderEmailLayout = ({
  title,
  intro,
  content,
  footerNote,
  accentColor = "#16a34a",
}: EmailLayoutOptions) => `
  <div style="font-family: Arial, sans-serif; background: #f7fdf9; padding: 24px; color: #111827;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px 24px 20px; box-shadow: 0 8px 24px rgba(16, 185, 129, 0.08);">
      <div style="display: inline-flex; align-items: center; gap: 8px; padding: 8px 12px; background: rgba(22, 163, 74, 0.08); color: ${accentColor}; border-radius: 9999px; font-weight: 700; letter-spacing: 0.4px;">
        <span style="width: 10px; height: 10px; background: ${accentColor}; border-radius: 9999px; display: inline-block;"></span>
        <span>Farmly</span>
      </div>

      <h2 style="margin: 16px 0 10px; color: #111827; font-size: 22px;">${title}</h2>
      ${intro ? `<p style="margin: 0 0 16px; color: #374151; line-height: 1.6;">${intro}</p>` : ""}

      ${content}

      <p style="margin: 24px 0 0; color: #6b7280; font-size: 12px; line-height: 1.6;">Táto správa bola odoslaná z Farmly. Ak si si ju nevyžiadal, kontaktuj podporu alebo ignoruj tento email.</p>
      ${footerNote ? `<p style="margin: 6px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">${footerNote}</p>` : ""}
    </div>
  </div>
`;
