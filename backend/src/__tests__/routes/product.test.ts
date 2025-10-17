import request from "supertest";
import app from "../../index";
import prisma from "../../prisma";
import jwt from "jsonwebtoken";

let FARMER_ID: number;
let OTHER_FARMER_ID: number;
let farmId: number;
let otherFarmId: number;
let productId: number;
let accessToken: string;
let otherAccessToken: string;

beforeAll(async () => {
  const farmer = await prisma.user.create({
    data: {
      email: "farmer@test.com",
      password: "hashedpassword",
      name: "Farmer",
      phone: "+421900000001",
      role: "FARMER",
    },
  });
  FARMER_ID = farmer.id;
  accessToken = jwt.sign(
    { id: FARMER_ID, role: "FARMER" },
    process.env.ACCESS_TOKEN_SECRET!
  );

  const otherFarmer = await prisma.user.create({
    data: {
      email: "otherfarmer@test.com",
      password: "hashedpassword",
      name: "Other Farmer",
      phone: "+421900000002",
      role: "FARMER",
    },
  });
  OTHER_FARMER_ID = otherFarmer.id;
  otherAccessToken = jwt.sign(
    { id: OTHER_FARMER_ID, role: "FARMER" },
    process.env.ACCESS_TOKEN_SECRET!
  );

  const farm = await prisma.farm.create({
    data: {
      name: "My Farm",
      farmerId: FARMER_ID,
      city: "Bratislava",
      street: "Main Street 1",
      region: "Bratislavský",
      postalCode: "81101",
      country: "Slovakia",
    },
  });
  farmId = farm.id;

  const otherFarm = await prisma.farm.create({
    data: {
      name: "Other Farm",
      farmerId: OTHER_FARMER_ID,
      city: "Košice",
      street: "Second Street 2",
      region: "Košický",
      postalCode: "04001",
      country: "Slovakia",
    },
  });
  otherFarmId = otherFarm.id;
});

afterAll(async () => {
  await prisma.product.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("Product Routes", () => {
  it("POST /product - should create product for own farm", async () => {
    const res = await request(app)
      .post("/api/product")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        name: "Test Product",
        category: "Fruits",
        description: "Test description",
        price: 10,
        farmId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Test Product");
    productId = res.body.id;
  });

  it("POST /product - should fail to create product for other farmer's farm", async () => {
    const res = await request(app)
      .post("/api/product")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        name: "Invalid Product",
        category: "Fruits",
        description: "Invalid description",
        price: 5,
        farmId: otherFarmId,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /product/farm/:id - should return products of own farm", async () => {
    const res = await request(app)
      .get(`/api/product/farm/${farmId}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("name", "Test Product");
  });

  it("GET /product/farm/:id - should fail for other farm", async () => {
    const res = await request(app)
      .get(`/api/product/farm/${otherFarmId}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("PUT /product/:id - should update own product", async () => {
    const res = await request(app)
      .put(`/api/product/${productId}`)
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({ price: 15 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("price", 15);
  });

  it("PUT /product/:id - should fail to update other farmer's product", async () => {
    const res = await request(app)
      .put(`/api/product/${productId}`)
      .set("Cookie", [`accessToken=${otherAccessToken}`])
      .send({ price: 20 });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("DELETE /product/:id - should delete own product", async () => {
    const res = await request(app)
      .delete(`/api/product/${productId}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Product deleted");
  });

  it("DELETE /product/:id - should fail to delete other farmer's product", async () => {
    const otherProduct = await prisma.product.create({
      data: {
        name: "Other Product",
        category: "Veg",
        description: "Other description",
        price: 5,
        farmId: otherFarmId,
      },
    });

    const res = await request(app)
      .delete(`/api/product/${otherProduct.id}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /product/:id - should return own product by id", async () => {
    const product = await prisma.product.create({
      data: {
        name: "Fetch Product",
        category: "Dairy",
        description: "Fetch description",
        price: 12,
        farmId,
      },
    });

    const res = await request(app)
      .get(`/api/product/${product.id}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("name", "Fetch Product");
  });

  it("GET /product/:id - should fail for other farmer's product", async () => {
    const otherProduct = await prisma.product.create({
      data: {
        name: "Other Fetch",
        category: "Meat",
        description: "Other fetch",
        price: 20,
        farmId: otherFarmId,
      },
    });

    const res = await request(app)
      .get(`/api/product/${otherProduct.id}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /product/:id - should return 401 without token", async () => {
    const product = await prisma.product.create({
      data: {
        name: "No Token Product",
        category: "Fruits",
        description: "No token",
        price: 5,
        farmId,
      },
    });

    const res = await request(app).get(`/api/product/${product.id}`);
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Access token missing");
  });
});
