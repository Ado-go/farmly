process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../../index";
import prisma from "../../prisma";

let farmerId: number;
let farm1Id: number;
let farm2Id: number;
const baseAddress = {
  address: "Main Street 1",
  postalCode: "01001",
  city: "Bratislava",
  country: "Slovakia",
};

beforeAll(async () => {
  await prisma.farmProduct.deleteMany({});
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
      ...baseAddress,
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
      images: {
        create: [
          {
            url: "https://example.com/farm1.jpg",
            publicId: "example_folder/exampleId",
          },
        ],
      },
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
      images: {
        create: [
          {
            url: "https://example.com/farm2.jpg",
            publicId: "example_folder/anotherId",
          },
        ],
      },
    },
  });

  farm1Id = farm1.id;
  farm2Id = farm2.id;

  await prisma.farmProduct.create({
    data: {
      farm: { connect: { id: farm1Id } },
      price: 1.99,
      stock: 30,
      product: {
        create: {
          name: "Fresh Milk",
          category: "Dairy",
          description: "Creamy milk from local cows",
          basePrice: 1.99,
        },
      },
    },
  });

  await prisma.farmProduct.create({
    data: {
      farm: { connect: { id: farm2Id } },
      price: 4.5,
      stock: 20,
      product: {
        create: {
          name: "Honey Jar",
          category: "Other",
          description: "Pure forest honey",
          basePrice: 4.5,
        },
      },
    },
  });
});

afterAll(async () => {
  await prisma.farmProduct.deleteMany({});
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
    expect(firstFarm.farmProducts.length).toBeGreaterThanOrEqual(1);

    expect(firstFarm.farmProducts[0].product).toHaveProperty(
      "name",
      "Fresh Milk"
    );
  });

  it("GET /api/farms/:id - should return a specific farm", async () => {
    const res = await request(app).get(`/api/farms/${farm2Id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", farm2Id);
    expect(res.body).toHaveProperty("name", "Sunny Hills");
    expect(res.body.farmer.name).toBe("Public Farmer");

    const hasHoney = res.body.farmProducts.some(
      (p: any) => p.product.name === "Honey Jar"
    );
    expect(hasHoney).toBe(true);
  });

  it("GET /api/farms/:id - should return 400 for invalid ID", async () => {
    const res = await request(app).get("/api/farms/invalid");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid farm ID");
  });

  it("GET /api/farms/:id - should return 404 for non-existing farm", async () => {
    const res = await request(app).get("/api/farms/999999");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Farm was not found");
  });
});
