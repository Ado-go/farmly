import request from "supertest";
import app from "../../index";
import prisma from "../../prisma";
import jwt from "jsonwebtoken";

let FARMER_ID: number;
let OTHER_FARMER_ID: number;
let farmId: number;
let otherFarmId: number;
let farmProductId: number;
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
  await prisma.farmProduct.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("FarmProduct Routes", () => {
  it("POST /farm-product - should create farm product for own farm", async () => {
    const res = await request(app)
      .post("/api/farm-product")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        name: "Test Product",
        category: "Fruits",
        description: "Test description",
        price: 10,
        stock: 5,
        farmId,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.product).toHaveProperty("name", "Test Product");
    farmProductId = res.body.id;
  });

  it("POST /farm-product - should fail to create product for other farmer's farm", async () => {
    const res = await request(app)
      .post("/api/farm-product")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        name: "Invalid Product",
        category: "Fruits",
        description: "Invalid description",
        price: 5,
        stock: 2,
        farmId: otherFarmId,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /farm-product/farm/:id - should return products of own farm", async () => {
    const res = await request(app)
      .get(`/api/farm-product/farm/${farmId}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].product).toHaveProperty("name", "Test Product");
  });

  it("GET /farm-product/farm/:id - should fail for other farm", async () => {
    const res = await request(app)
      .get(`/api/farm-product/farm/${otherFarmId}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("PUT /farm-product/:id - should update own product", async () => {
    const res = await request(app)
      .put(`/api/farm-product/${farmProductId}`)
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({ price: 15, stock: 20 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("price", 15);
    expect(res.body).toHaveProperty("stock", 20);
  });

  it("PUT /farm-product/:id - should fail to update other farmer's product", async () => {
    const res = await request(app)
      .put(`/api/farm-product/${farmProductId}`)
      .set("Cookie", [`accessToken=${otherAccessToken}`])
      .send({ price: 20 });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /farm-product/:id - should return own product by id", async () => {
    const res = await request(app)
      .get(`/api/farm-product/${farmProductId}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.product).toHaveProperty("name", "Test Product");
  });

  it("GET /farm-product/:id - should fail for other farmer's product", async () => {
    const otherFarmProduct = await prisma.farmProduct.create({
      data: {
        farm: { connect: { id: otherFarmId } },
        price: 8,
        stock: 10,
        product: {
          create: {
            name: "Other Fetch",
            category: "Meat",
            description: "Other fetch",
            basePrice: 2.5,
          },
        },
      },
    });

    const res = await request(app)
      .get(`/api/farm-product/${otherFarmProduct.id}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("DELETE /farm-product/:id - should delete own product", async () => {
    const res = await request(app)
      .delete(`/api/farm-product/${farmProductId}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Farm product deleted");
  });

  it("DELETE /farm-product/:id - should fail to delete other farmer's product", async () => {
    const otherFarmProduct = await prisma.farmProduct.create({
      data: {
        farm: { connect: { id: otherFarmId } },
        price: 5,
        stock: 10,
        product: {
          create: {
            name: "Other Product",
            category: "Veg",
            description: "Other description",
            basePrice: 3,
          },
        },
      },
    });

    const res = await request(app)
      .delete(`/api/farm-product/${otherFarmProduct.id}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /farm-product/:id - should return 401 without token", async () => {
    const fp = await prisma.farmProduct.create({
      data: {
        farm: { connect: { id: farmId } },
        price: 10,
        stock: 10,
        product: {
          create: {
            name: "No Token Product",
            category: "Fruits",
            description: "No token",
            basePrice: 2,
          },
        },
      },
    });

    const res = await request(app).get(`/api/farm-product/${fp.id}`);
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Access token missing");
  });
});
