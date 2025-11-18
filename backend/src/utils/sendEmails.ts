import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
  // Prevent sending emails during tests
  if (process.env.NODE_ENV === "test") {
    console.log("TEST MODE: Email skipped");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false, // TLS (587)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};
