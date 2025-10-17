process.env.NODE_ENV = "test";

import request from "supertest";
import prisma from "../../prisma.ts";
import app from "../../index.ts";
import jwt from "jsonwebtoken";

let token: string;
let farmId: number;
let farmerId: number;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: "farmer@test.com",
      password: "hashedpassword",
      name: "Test Farmer",
      phone: "123456789",
      role: "FARMER",
    },
  });

  farmerId = user.id;

  token = jwt.sign(
    { id: user.id, role: "FARMER" },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: "1h" }
  );
});

afterAll(async () => {
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("Farm routes", () => {
  // CREATE
  it("should create a farm", async () => {
    const res = await request(app)
      .post("/api/farm")
      .set("Cookie", [`accessToken=${token}`])
      .send({
        name: "Test Farm",
        description: "Test description",
        city: "Test City",
        street: "Test Street",
        region: "Test Region",
        postalCode: "12345",
        country: "Test Country",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Test Farm");
    farmId = res.body.id;
  });

  // READ ALL
  it("should get all farms of the farmer", async () => {
    const res = await request(app)
      .get("/api/farm")
      .set("Cookie", [`accessToken=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe(farmId);
  });

  // READ ONE
  it("should get a farm by id", async () => {
    const res = await request(app)
      .get(`/api/farm/${farmId}`)
      .set("Cookie", [`accessToken=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(farmId);
  });

  // UPDATE
  it("should update a farm", async () => {
    const res = await request(app)
      .put(`/api/farm/${farmId}`)
      .set("Cookie", [`accessToken=${token}`])
      .send({
        description: "Updated description",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.description).toBe("Updated description");
  });

  // DELETE
  it("should delete a farm", async () => {
    const res = await request(app)
      .delete(`/api/farm/${farmId}`)
      .set("Cookie", [`accessToken=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Farm was successfully deleted");

    const farm = await prisma.farm.findUnique({ where: { id: farmId } });
    expect(farm).toBeNull();
  });

  // UNAUTHORIZED
  it("should return 401 if no cookie provided", async () => {
    const res = await request(app).get("/api/farm");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Access token missing");
  });
});
