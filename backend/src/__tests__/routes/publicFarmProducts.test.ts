process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../../index.ts";
import prisma from "../../prisma.ts";

let farm1Id: number;
let farm2Id: number;
let farmProduct1Id: number;
let farmProduct2Id: number;
let product1Id: number;
let product2Id: number;

beforeAll(async () => {
  const farm1 = await prisma.farm.create({
    data: {
      name: "Farm One",
      description: "First test farm",
      city: "Bratislava",
      street: "Main 1",
      region: "Bratislavský",
      postalCode: "81101",
      country: "Slovakia",
      farmer: {
        create: {
          email: "farmer1@test.com",
          password: "hashedpassword",
          name: "Farmer One",
          phone: "+421900000001",
          role: "FARMER",
        },
      },
    },
  });

  const farm2 = await prisma.farm.create({
    data: {
      name: "Farm Two",
      description: "Second test farm",
      city: "Košice",
      street: "Second 2",
      region: "Košický",
      postalCode: "04001",
      country: "Slovakia",
      farmer: {
        create: {
          email: "farmer2@test.com",
          password: "hashedpassword",
          name: "Farmer Two",
          phone: "+421900000002",
          role: "FARMER",
        },
      },
    },
  });

  farm1Id = farm1.id;
  farm2Id = farm2.id;

  const farmProduct1 = await prisma.farmProduct.create({
    data: {
      farm: { connect: { id: farm1Id } },
      price: 3.5,
      stock: 20,
      product: {
        create: {
          name: "Apple Juice",
          category: "Drinks",
          description: "Fresh apple juice",
          basePrice: 3.5,
        },
      },
    },
    include: { product: true },
  });

  const farmProduct2 = await prisma.farmProduct.create({
    data: {
      farm: { connect: { id: farm2Id } },
      price: 7.9,
      stock: 15,
      product: {
        create: {
          name: "Goat Cheese",
          category: "Dairy",
          description: "Homemade cheese",
          basePrice: 7.9,
        },
      },
    },
    include: { product: true },
  });

  farmProduct1Id = farmProduct1.id;
  farmProduct2Id = farmProduct2.id;
  product1Id = farmProduct1.product.id;
  product2Id = farmProduct2.product.id;
});

afterAll(async () => {
  await prisma.farmProduct.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("Public FarmProducts Routes", () => {
  it("GET /public-farm-products - should return all farm products", async () => {
    const res = await request(app).get("/api/public-farm-products");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);

    const names = res.body.items.map((p: any) => p.product.name);
    expect(names).toContain("Apple Juice");
    expect(names).toContain("Goat Cheese");

    const appleProduct = res.body.items.find(
      (p: any) => p.product.name === "Apple Juice"
    );
    expect(appleProduct.farm).toHaveProperty("name", "Farm One");
    expect(appleProduct).toHaveProperty("price", 3.5);
  });

  it("GET /public-farm-products/:id - should return a specific farm product", async () => {
    const res = await request(app).get(
      `/api/public-farm-products/${product2Id}`
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.product).toHaveProperty("name", "Goat Cheese");
    expect(res.body.farm).toHaveProperty("name", "Farm Two");
  });

  it("GET /public-farm-products/:id - should return 404 for non-existing product", async () => {
    const res = await request(app).get("/api/public-farm-products/99999");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Product was not found");
  });

  it("GET /public-farm-products/:id - should return 400 for invalid id", async () => {
    const res = await request(app).get("/api/public-farm-products/invalid");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid product ID");
  });
});
