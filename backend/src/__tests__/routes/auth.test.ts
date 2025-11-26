process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ?? "access-secret";
process.env.REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ?? "refresh-secret";
process.env.RESET_TOKEN_SECRET =
  process.env.RESET_TOKEN_SECRET ?? "reset-secret";
process.env.CLIENT_URL = process.env.CLIENT_URL ?? "https://client.com";

import request from "supertest";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import app from "../../index.ts";
import prisma from "../../prisma.ts";

describe("Auth routes", () => {
  const baseAddress = {
    address: "Main Street 1",
    postalCode: "01001",
    city: "Bratislava",
    country: "Slovakia",
  };

  beforeEach(async () => {
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  // === REGISTER TESTS ===
  test("POST /api/auth/register - creates user successfully", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "test@test.com",
        name: "John Johnson",
        phone: "+421940123456",
        password: "123456",
        role: "FARMER",
        ...baseAddress,
      });

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({
      email: "test@test.com",
      name: "John Johnson",
      phone: "+421940123456",
      role: "FARMER",
      ...baseAddress,
    });
  });

  test("POST /api/auth/register - missing fields returns 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "missing@test.com",
      password: "123456",
      role: "FARMER",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid request data");
  });

  test("POST /api/auth/register - user already exists returns 400", async () => {
    await prisma.user.create({
      data: {
        email: "test@test.com",
        password: "hashedpassword",
        name: "John",
        phone: "+421900000000",
        role: "FARMER",
        ...baseAddress,
      },
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: "test@test.com",
        password: "123456",
        role: "FARMER",
        name: "John",
        phone: "+421900000000",
        ...baseAddress,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("User already exists");
  });

  // === LOGIN TESTS ===
  test("POST /api/auth/login - valid credentials", async () => {
    const hashed = await argon2.hash("123456");
    await prisma.user.create({
      data: {
        email: "test@test.com",
        password: hashed,
        role: "FARMER",
        name: "John",
        phone: "+421900000000",
        ...baseAddress,
      },
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "123456" });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("test@test.com");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  test("POST /api/auth/login - invalid email returns 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "notfound@test.com", password: "123456" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  test("POST /api/auth/login - invalid password returns 401", async () => {
    const hashed = await argon2.hash("correctpass");
    await prisma.user.create({
      data: {
        email: "test@test.com",
        password: hashed,
        role: "FARMER",
        name: "John",
        phone: "+421900000000",
        ...baseAddress,
      },
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Invalid credentials");
  });

  // === FORGOT PASSWORD ===
  test("POST /api/auth/forgot-password - sends reset email", async () => {
    await prisma.user.create({
      data: {
        email: "test@test.com",
        password: "hashedpassword",
        name: "User",
        phone: "+421900000001",
        role: "CUSTOMER",
        resetToken: null,
        ...baseAddress,
      },
    });

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "test@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password reset email sent");
  });

  test("POST /api/auth/forgot-password - user not found", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "missing@test.com" });
    expect(res.status).toBe(404);
  });

  // === RESET PASSWORD ===
  test("POST /api/auth/reset-password - valid token resets password", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@test.com",
        password: "hashedpassword",
        name: "User",
        phone: "+421900000001",
        role: "CUSTOMER",
        ...baseAddress,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.RESET_TOKEN_SECRET!
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token },
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, newPassword: "newpass123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password successfully reset");
  });

  test("POST /api/auth/reset-password - invalid token", async () => {
    await prisma.user.create({
      data: {
        email: "test@test.com",
        password: "hashedpassword",
        name: "User",
        phone: "+421900000001",
        role: "CUSTOMER",
        resetToken: "different-token",
        ...baseAddress,
      },
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "invalid-token", newPassword: "pass123" });

    expect(res.status).toBe(403);
  });

  // === REFRESH TOKEN ===
  test("POST /api/auth/refresh - returns new access token when token matches DB", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@test.com",
        password: "hashed",
        name: "John",
        phone: "+421900000000",
        role: "FARMER",
        ...baseAddress,
      },
    });

    const refreshToken = jwt.sign(
      { id: user.id, role: "FARMER" },
      process.env.REFRESH_TOKEN_SECRET!
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Access token refreshed");
  });

  test("POST /api/auth/refresh - invalid or missing token returns 401", async () => {
    const res = await request(app).post("/api/auth/refresh");
    expect(res.status).toBe(401);
  });

  test("POST /api/auth/refresh - token not in DB returns 403", async () => {
    const refreshToken = jwt.sign(
      { id: 2, role: "FARMER" },
      process.env.REFRESH_TOKEN_SECRET!
    );

    await prisma.user.create({
      data: {
        email: "no@db.com",
        password: "hashed",
        name: "No DB",
        phone: "+421900000999",
        role: "FARMER",
        refreshToken: "different-token",
        ...baseAddress,
      },
    });

    const res = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(403);
  });

  // === CHANGE PASSWORD ===
  test("POST /api/auth/change-password - successfully changes password", async () => {
    const oldHashed = await argon2.hash("oldPassword123");
    const user = await prisma.user.create({
      data: {
        email: "test@test.com",
        password: oldHashed,
        name: "User",
        phone: "+421900000001",
        role: "FARMER",
        ...baseAddress,
      },
    });

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        oldPassword: "oldPassword123",
        newPassword: "newPassword456",
      });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Password successfully changed");
  });

  test("POST /api/auth/change-password - missing data returns 400", async () => {
    const user = await prisma.user.create({
      data: {
        email: "test@test.com",
        password: await argon2.hash("oldPassword123"),
        name: "User",
        phone: "+421900000001",
        role: "FARMER",
        ...baseAddress,
      },
    });

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({ oldPassword: "" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Missing data");
  });

  test("POST /api/auth/change-password - invalid user returns 401", async () => {
    const accessToken = jwt.sign(
      { id: 99, role: "FARMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        oldPassword: "oldPass",
        newPassword: "newPass",
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid user id");
  });

  test("POST /api/auth/change-password - invalid old password returns 401", async () => {
    const hashed = await argon2.hash("correctOldPassword");
    const user = await prisma.user.create({
      data: {
        email: "test@test.com",
        password: hashed,
        name: "User",
        phone: "+421900000001",
        role: "FARMER",
        ...baseAddress,
      },
    });

    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        oldPassword: "wrongOldPassword",
        newPassword: "newPassword",
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Invalid password");
  });

  // === LOGOUT ===
  test("POST /api/auth/logout - clears cookies", async () => {
    const refreshToken = jwt.sign(
      { id: 1, role: "FARMER" },
      process.env.REFRESH_TOKEN_SECRET!
    );

    await prisma.user.create({
      data: {
        email: "test@test.com",
        password: "hashed",
        name: "User",
        phone: "+421900000001",
        role: "FARMER",
        refreshToken,
        ...baseAddress,
      },
    });

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [`refreshToken=${refreshToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out");
  });
});
