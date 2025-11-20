const RESEND_API_URL = "https://api.resend.com/emails";

export const sendEmail = async (to: string, subject: string, html: string) => {
  // Prevent sending emails during tests
  if (process.env.NODE_ENV === "test") {
    console.log("TEST MODE: Email skipped");
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (!apiKey || !from) {
    console.error("Missing email env vars. Need RESEND_API_KEY and EMAIL_FROM/EMAIL_USER");
    throw new Error("Email service not configured");
  }

  const payload = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };

  const resp = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("Resend error:", resp.status, text);
    throw new Error("Failed to send email");
  }
};
