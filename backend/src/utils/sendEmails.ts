import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
  // Prevent sending emails during tests
  if (process.env.NODE_ENV === "test") {
    console.log("TEST MODE: Email skipped");
    return;
  }

  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || user;

  if (!host || !port || !user || !pass || !from) {
    console.error(
      "Missing email env vars. Check EMAIL_HOST/PORT/USER/PASS/FROM"
    );
    throw new Error("Email service not configured");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // 465: SSL, 587: STARTTLS
    auth: {
      user,
      pass,
    },
    tls: { rejectUnauthorized: false },
    logger: true,
    debug: true,
  });

  const mailOptions = {
    from,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
