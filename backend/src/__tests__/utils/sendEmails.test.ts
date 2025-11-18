import nodemailer from "nodemailer";
import { sendEmail } from "../../utils/sendEmails";

jest.mock("nodemailer");

describe.skip("sendEmail utility", () => {
  const mockSendMail = jest.fn().mockResolvedValue("Mail sent");
  const mockCreateTransport = {
    sendMail: mockSendMail,
  };

  beforeAll(() => {
    // @ts-ignore
    (nodemailer.createTransport as jest.Mock).mockReturnValue(
      mockCreateTransport
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create transporter with correct configuration", async () => {
    process.env.EMAIL_HOST = "smtp.test.com";
    process.env.EMAIL_PORT = "587";
    process.env.EMAIL_USER = "user@test.com";
    process.env.EMAIL_PASS = "password";
    process.env.EMAIL_FROM = "no-reply@test.com";

    await sendEmail("to@test.com", "Subject", "<p>Test</p>");

    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: "smtp.test.com",
      port: 587,
      secure: false,
      auth: {
        user: "user@test.com",
        pass: "password",
      },
    });
  });

  it("should call sendMail with correct mail options", async () => {
    process.env.EMAIL_FROM = "no-reply@test.com";

    await sendEmail("to@test.com", "Hello", "<p>Body</p>");

    expect(mockSendMail).toHaveBeenCalledWith({
      from: "no-reply@test.com",
      to: "to@test.com",
      subject: "Hello",
      html: "<p>Body</p>",
    });
  });

  it("should throw if sendMail fails", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("SMTP error"));

    await expect(
      sendEmail("to@test.com", "Fail", "<p>Oops</p>")
    ).rejects.toThrow("SMTP error");
  });
});
