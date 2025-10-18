process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../../index";
import prisma from "../../prisma";

let farm1Id: number;
let farm2Id: number;
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

  const product1 = await prisma.product.create({
    data: {
      name: "Apple Juice",
      category: "Drinks",
      description: "Fresh apple juice",
      price: 3.5,
      farmId: farm1Id,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "Goat Cheese",
      category: "Dairy",
      description: "Homemade cheese",
      price: 7.9,
      farmId: farm2Id,
    },
  });

  product1Id = product1.id;
  product2Id = product2.id;
});

afterAll(async () => {
  await prisma.product.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("Products Routes", () => {
  it("GET /products - should return all products", async () => {
    const res = await request(app).get("/api/products");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);

    const productNames = res.body.map((p: any) => p.name);
    expect(productNames).toContain("Apple Juice");
    expect(productNames).toContain("Goat Cheese");

    const firstProduct = res.body.find((p: any) => p.name === "Apple Juice");
    expect(firstProduct.farm).toHaveProperty("name", "Farm One");
  });

  it("GET /products/:id - should return a specific product", async () => {
    const res = await request(app).get(`/api/products/${product2Id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", product2Id);
    expect(res.body).toHaveProperty("name", "Goat Cheese");
    expect(res.body.farm.name).toBe("Farm Two");
  });

  it("GET /products/:id - should return 404 for non-existing product", async () => {
    const res = await request(app).get("/api/products/99999");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "Product was not found");
  });

  it("GET /products/:id - should return 400 for invalid id", async () => {
    const res = await request(app).get("/api/products/invalid");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid product ID");
  });
});
