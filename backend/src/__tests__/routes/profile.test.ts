import request from "supertest";
import app from "../../index";
import prisma from "../../prisma";
import argon2 from "argon2";
import jwt from "jsonwebtoken";

let accessToken: string;
let testUserId: number;
const baseAddress = {
  address: "Main Street 1",
  postalCode: "01001",
  city: "Bratislava",
  country: "Slovakia",
};

beforeAll(async () => {
  const hashedPassword = await argon2.hash("password123");
  const user = await prisma.user.create({
    data: {
      email: "profile@test.com",
      password: hashedPassword,
      name: "Test User",
      phone: "+421940123456",
      role: "CUSTOMER",
      ...baseAddress,
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
    await prisma.user.deleteMany({
      where: { id: testUserId },
    });
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
    expect(res.body.user).toHaveProperty("address", baseAddress.address);
    expect(res.body.user).toHaveProperty("postalCode", baseAddress.postalCode);
  });

  it("PUT /profile - should update user data", async () => {
    const payload = {
      name: "Updated User",
      phone: "+421940456123",
      address: "Updated Street 99",
      postalCode: "04001",
      city: "Kosice",
      country: "Slovakia",
      role: "ADMIN",
    };

    const res = await request(app)
      .put("/api/profile")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body.user).toHaveProperty("name", "Updated User");
    expect(res.body.user).toHaveProperty("phone", "+421940456123");
    expect(res.body.user).toHaveProperty("address", "Updated Street 99");
    expect(res.body.user).toHaveProperty("postalCode", "04001");
    expect(res.body.user).toHaveProperty("city", "Kosice");
    expect(res.body.user).toHaveProperty("country", "Slovakia");
    expect(res.body.user).toHaveProperty("role", "CUSTOMER");
  });

  it("PUT /profile - should return 400 for invalid data", async () => {
    const res = await request(app)
      .put("/api/profile")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        name: "A",
        phone: "123",
        address: "12",
        postalCode: "1",
        city: "",
        country: "",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid request data");
  });

  it("DELETE /profile - should delete user with correct password", async () => {
    const res = await request(app)
      .delete("/api/profile")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({ password: "password123" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "User deleted successfully");

    const deletedUser = await prisma.user.findUnique({
      where: { id: testUserId },
    });
    expect(deletedUser).toBeNull();
  });

  it("DELETE /profile - should fail with incorrect password", async () => {
    const hashedPassword = await argon2.hash("password123");
    const user = await prisma.user.create({
      data: {
        email: "profile2@test.com",
        password: hashedPassword,
        name: "Test User 2",
        phone: "+421940123457",
        role: "CUSTOMER",
        ...baseAddress,
      },
    });
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "15m" }
    );

    const res = await request(app)
      .delete("/api/profile")
      .set("Cookie", [`accessToken=${token}`])
      .send({ password: "wrongpassword" });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("message", "Incorrect password");

    await prisma.user.delete({ where: { id: user.id } });
  });

  it("GET /profile - should return 401 without token", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Access token missing");
  });
});
