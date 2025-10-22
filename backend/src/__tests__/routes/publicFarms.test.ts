process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../../index";
import prisma from "../../prisma";

let farmerId: number;
let farm1Id: number;
let farm2Id: number;

beforeAll(async () => {
  await prisma.product.deleteMany({});
  await prisma.farmImage.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});

  const farmer = await prisma.user.create({
    data: {
      email: "publicfarmer@test.com",
      password: "hashedpassword",
      name: "Public Farmer",
      phone: "+421900123456",
      role: "FARMER",
    },
  });
  farmerId = farmer.id;

  const farm1 = await prisma.farm.create({
    data: {
      name: "Green Valley",
      description: "Organic farm near Bratislava",
      city: "Bratislava",
      street: "Farm Street 1",
      region: "Bratislavský",
      postalCode: "81101",
      country: "Slovakia",
      farmerId,
      images: { create: [{ url: "https://example.com/farm1.jpg" }] },
    },
  });

  const farm2 = await prisma.farm.create({
    data: {
      name: "Sunny Hills",
      description: "Family-run farm in Košice",
      city: "Košice",
      street: "Hill Street 2",
      region: "Košický",
      postalCode: "04001",
      country: "Slovakia",
      farmerId,
      images: { create: [{ url: "https://example.com/farm2.jpg" }] },
    },
  });

  farm1Id = farm1.id;
  farm2Id = farm2.id;

  await prisma.product.create({
    data: {
      name: "Fresh Milk",
      category: "Dairy",
      description: "Creamy milk from local cows",
      price: 1.99,
      farmId: farm1Id,
    },
  });

  await prisma.product.create({
    data: {
      name: "Honey Jar",
      category: "Sweets",
      description: "Pure forest honey",
      price: 4.5,
      farmId: farm2Id,
    },
  });
});

afterAll(async () => {
  await prisma.product.deleteMany({});
  await prisma.farmImage.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("Public Farms Routes", () => {
  it("GET /api/farms - should return all farms", async () => {
    const res = await request(app).get("/api/farms");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    const farmNames = res.body.map((f: any) => f.name);
    expect(farmNames).toContain("Green Valley");
    expect(farmNames).toContain("Sunny Hills");

    const firstFarm = res.body.find((f: any) => f.name === "Green Valley");
    expect(firstFarm.farmer).toHaveProperty("name", "Public Farmer");
    expect(firstFarm).toHaveProperty("images");
    expect(firstFarm.products.length).toBeGreaterThanOrEqual(1);
  });

  it("GET /api/farms/:id - should return a specific farm", async () => {
    const res = await request(app).get(`/api/farms/${farm2Id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", farm2Id);
    expect(res.body).toHaveProperty("name", "Sunny Hills");
    expect(res.body.farmer.name).toBe("Public Farmer");
    expect(res.body.products.some((p: any) => p.name === "Honey Jar")).toBe(
      true
    );
  });

  it("GET /api/farms/:id - should return 400 for invalid ID", async () => {
    const res = await request(app).get("/api/farms/invalid");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid farm ID");
  });

  it("GET /api/farms/:id - should return 400 for non-existing farm", async () => {
    const res = await request(app).get("/api/farms/999999");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Farm was not found");
  });
});
