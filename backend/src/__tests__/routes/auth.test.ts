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
      name: "John Johnson",
      phone: "+421940123456",
      role: "FARMER",
    });

    const res = await request(app).post("/auth/register").send({
      email: "test@test.com",
      name: "John Johnson",
      phone: "+421940123456",
      password: "123456",
      role: "FARMER",
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: "test@test.com",
      name: "John Johnson",
      phone: "+421940123456",
      role: "FARMER",
    });
  });

  test("POST /auth/register - missing fields returns 400", async () => {
    const res = await request(app).post("/auth/register").send({
      email: "missing@test.com",
      password: "123456",
      role: "FARMER",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid request data");
  });

  test("POST /auth/register - user already exists returns 400", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 1, email: "test@test.com" });

    const res = await request(app).post("/auth/register").send({
      email: "test@test.com",
      password: "123456",
      role: "FARMER",
      name: "John",
      phone: "+421900000000",
    });

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
      name: "John",
      phone: "+421900000000",
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

  test("POST /auth/forgot-password - user not found", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .post("/auth/forgot-password")
      .send({ email: "missing@test.com" });
    expect(res.status).toBe(404);
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

  test("POST /auth/reset-password - invalid token", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "test@test.com",
      resetToken: "different-token",
    });

    const res = await request(app)
      .post("/auth/reset-password")
      .send({ token: "invalid-token", newPassword: "pass123" });

    expect(res.status).toBe(403);
  });

  // === REFRESH TOKEN ===
  test("POST /auth/refresh - returns new access token when token matches DB", async () => {
    const jwt = await import("jsonwebtoken");
    const refreshToken = jwt.sign(
      { id: 1, role: "FARMER" },
      process.env.REFRESH_TOKEN_SECRET!
    );

    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "test@test.com",
      refreshToken,
    });

    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Access token refreshed");
  });

  test("POST /auth/refresh - invalid or missing token returns 401", async () => {
    const res = await request(app).post("/auth/refresh");
    expect(res.status).toBe(401);
  });

  test("POST /auth/refresh - token not in DB returns 403", async () => {
    const jwt = await import("jsonwebtoken");
    const refreshToken = jwt.sign(
      { id: 2, role: "FARMER" },
      process.env.REFRESH_TOKEN_SECRET!
    );

    prisma.user.findUnique.mockResolvedValue({
      id: 2,
      email: "no@db.com",
      refreshToken: "different-token",
    });

    const res = await request(app)
      .post("/auth/refresh")
      .set("Cookie", [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(403);
  });

  // === CHANGE PASSWORD ===
  test("POST /auth/change-password - successfully changes password", async () => {
    const jwt = await import("jsonwebtoken");
    const argon2 = await import("argon2");

    const accessToken = jwt.sign(
      { id: 1, role: "FARMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const oldHashed = await argon2.hash("oldPassword123");

    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "test@test.com",
      password: oldHashed,
    });
    prisma.user.update.mockResolvedValue({});

    const res = await request(app)
      .post("/auth/change-password")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        oldPassword: "oldPassword123",
        newPassword: "newPassword456",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password successfully changed");
  });

  test("POST /auth/change-password - missing data returns 400", async () => {
    const jwt = await import("jsonwebtoken");
    const accessToken = jwt.sign(
      { id: 1, role: "FARMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const res = await request(app)
      .post("/auth/change-password")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({ oldPassword: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Missing data");
  });

  test("POST /auth/change-password - invalid user returns 401", async () => {
    const jwt = await import("jsonwebtoken");
    const accessToken = jwt.sign(
      { id: 99, role: "FARMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/auth/change-password")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        oldPassword: "oldPass",
        newPassword: "newPass",
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid user id");
  });

  test("POST /auth/change-password - invalid old password returns 401", async () => {
    const jwt = await import("jsonwebtoken");
    const argon2 = await import("argon2");
    const accessToken = jwt.sign(
      { id: 1, role: "FARMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const hashed = await argon2.hash("correctOldPassword");
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email: "test@test.com",
      password: hashed,
    });

    const res = await request(app)
      .post("/auth/change-password")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        oldPassword: "wrongOldPassword",
        newPassword: "newPassword",
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid password");
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
