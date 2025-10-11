process.env.ACCESS_TOKEN_SECRET = "access-secret";
process.env.REFRESH_TOKEN_SECRET = "refresh-secret";
process.env.RESET_TOKEN_SECRET = "reset-secret";
process.env.CLIENT_URL = "https://client.com";
process.env.NODE_ENV = "test";

import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";

jest.mock("../../prisma", () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../../src/utils/sendEmails", () => ({
  sendEmail: jest.fn(),
}));

describe("Auth routes", () => {
  let app: express.Express;
  let prisma: any;
  let sendEmail: any;

  beforeAll(async () => {
    const routerModule = await import("../../../src/routes/auth");
    const router = routerModule.default;

    prisma = (await import("../../prisma")).default;
    sendEmail = (await import("../../../src/utils/sendEmails")).sendEmail;

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use("/auth", router);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });
  // === REGISTER TESTS ===
  test("POST /auth/register - creates user successfully", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 1,
      email: "test@test.com",
      role: "FARMER",
    });

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@test.com", password: "123456", role: "FARMER" });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email: "test@test.com",
      role: "FARMER",
    });
  });

  test("POST /auth/register - missing data returns 400", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@test.com" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Missing email or password or role");
  });

  test("POST /auth/register - user already exists returns 400", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: "test@test.com" });

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "test@test.com", password: "123456", role: "FARMER" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User already exists");
  });

  // === LOGIN TESTS ===
  test("POST /auth/login - valid credentials", async () => {
    const argon2 = await import("argon2");
    const mockUser = {
      id: 1,
      email: "test@test.com",
      password: await argon2.hash("123456"),
      role: "FARMER",
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.user.update.mockResolvedValue(mockUser);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@test.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("test@test.com");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  test("POST /auth/login - invalid email returns 401", async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "notfound@test.com", password: "123456" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("POST /auth/login - invalid password returns 401", async () => {
    const argon2 = await import("argon2");
    const mockUser = {
      id: 1,
      email: "test@test.com",
      password: await argon2.hash("correctpass"),
      role: "FARMER",
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "test@test.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  // === FORGOT PASSWORD ===
  test("POST /auth/forgot-password - sends reset email", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "test@test.com",
      resetToken: null,
    });
    prisma.user.update.mockResolvedValue({});
    sendEmail.mockResolvedValue(true);

    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "test@test.com" });

    expect(res.status).toBe(200);
    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  // === RESET PASSWORD ===
  test("POST /auth/reset-password - valid token resets password", async () => {
    const jwt = await import("jsonwebtoken");
    const token = jwt.sign({ id: 1, email: "test@test.com" }, "reset-secret");

    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "test@test.com",
      resetToken: token,
    });

    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/auth/reset-password")
      .send({ token, newPassword: "newpass123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password successfully reset");
  });

  // === REFRESH TOKEN ===
  test("POST /auth/refresh - returns new access token", async () => {
    const jwt = await import("jsonwebtoken");
    const refreshToken = jwt.sign(
      { id: 1, role: "FARMER" },
      process.env.REFRESH_TOKEN_SECRET!
    );

    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Access token refreshed");
  });

  // === LOGOUT ===
  test("POST /auth/logout - clears cookies", async () => {
    const jwt = await import("jsonwebtoken");
    const refreshToken = jwt.sign(
      { id: 1, role: "FARMER" },
      process.env.REFRESH_TOKEN_SECRET!
    );

    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/auth/logout")
      .set("Cookie", [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out");
  });
});
