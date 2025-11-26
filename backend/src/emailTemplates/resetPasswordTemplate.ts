export const buildResetPasswordEmail = (resetLink: string) => ({
  subject: "Resetovanie hesla (Password reset)",
  html: `
    <div style="font-family: Arial, sans-serif; color: #111827;">
      <h2 style="color: #16a34a; margin-bottom: 8px;">Resetovanie hesla</h2>
      <p style="margin: 0 0 8px;">Klikni na tento odkaz pre obnovenie hesla (platný 15 minút):</p>
      <a href="${resetLink}" target="_blank" style="color: #16a34a;">${resetLink}</a>
      <p style="margin: 12px 0 20px;">Ak si o reset nežiadal, ignoruj tento email.</p>

      <h2 style="color: #16a34a; margin: 8px 0;">Password reset</h2>
      <p style="margin: 0 0 8px;">Click this link to reset your password (valid for 15 minutes):</p>
      <a href="${resetLink}" target="_blank" style="color: #16a34a;">${resetLink}</a>
      <p style="margin: 12px 0 0;">If you did not request a reset, please ignore this email.</p>
    </div>
  `,
});
