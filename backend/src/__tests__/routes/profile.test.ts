import request from "supertest";
import app from "../../index";
import prisma from "../../prisma";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

let accessToken: string;
let testUserId: number;

beforeAll(async () => {
  const hashedPassword = await argon2.hash("password123");
  const user = await prisma.user.create({
    data: {
      email: "profile@test.com",
      password: hashedPassword,
      name: "Test User",
      phone: "+421940123456",
      role: "CUSTOMER",
    },
  });
  testUserId = user.id;

  accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: "15m" }
  );
});

afterAll(async () => {
  try {
    const user = await prisma.user.findUnique({ where: { id: testUserId } });
    if (user) {
      await prisma.user.delete({ where: { id: testUserId } });
    }
  } catch (err) {
    console.error("Cleanup failed:", err);
  } finally {
    await prisma.$disconnect();
  }
});

describe("Profile Routes", () => {
  it("GET /profile - should return user data", async () => {
    const res = await request(app)
      .get("/api/profile")
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("id", testUserId);
    expect(res.body.user).toHaveProperty("email", "profile@test.com");
    expect(res.body.user).toHaveProperty("name", "Test User");
  });

  it("PUT /profile - should update user data", async () => {
    const res = await request(app)
      .put("/api/profile")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        name: "Updated User",
        phone: "+421940456123",
        role: "CUSTOMER",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("name", "Updated User");
    expect(res.body.user).toHaveProperty("phone", "+421940456123");
    expect(res.body.user).toHaveProperty("role", "CUSTOMER");
  });

  it("PUT /profile - should return 400 for invalid data", async () => {
    const res = await request(app)
      .put("/api/profile")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        name: "A",
        phone: "123",
        role: "INVALID_ROLE",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid request data");
  });

  it("DELETE /profile - should delete user", async () => {
    const res = await request(app)
      .delete("/api/profile")
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "User deleted successfully");

    const deletedUser = await prisma.user.findUnique({
      where: { id: testUserId },
    });
    expect(deletedUser).toBeNull();
  });

  it("GET /profile - should return 401 without token", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Access token missing");
  });
});
