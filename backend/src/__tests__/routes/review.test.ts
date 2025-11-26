process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../../index.ts";
import prisma from "../../prisma.ts";
import jwt from "jsonwebtoken";

let USER_ID: number;
let OTHER_USER_ID: number;
let productId: number;
let reviewId: number;
let accessToken: string;
let otherAccessToken: string;
const baseAddress = {
  address: "Main Street 1",
  postalCode: "01001",
  city: "Bratislava",
  country: "Slovakia",
};

beforeAll(async () => {
  await prisma.review.deleteMany({});
  await prisma.farmProduct.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});

  const user = await prisma.user.create({
    data: {
      email: "user@test.com",
      password: "hashedpassword",
      name: "User",
      phone: "+421900000001",
      role: "CUSTOMER",
      ...baseAddress,
    },
  });
  USER_ID = user.id;
  accessToken = jwt.sign(
    { id: USER_ID, role: "CUSTOMER" },
    process.env.ACCESS_TOKEN_SECRET!
  );

  const otherUser = await prisma.user.create({
    data: {
      email: "otheruser@test.com",
      password: "hashedpassword",
      name: "Other User",
      phone: "+421900000002",
      role: "CUSTOMER",
      ...baseAddress,
    },
  });
  OTHER_USER_ID = otherUser.id;
  otherAccessToken = jwt.sign(
    { id: OTHER_USER_ID, role: "CUSTOMER" },
    process.env.ACCESS_TOKEN_SECRET!
  );

  const farm = await prisma.farm.create({
    data: {
      name: "Test Farm",
      city: "Bratislava",
      street: "Main 1",
      region: "Bratislavský",
      postalCode: "81101",
      country: "Slovakia",
      farmer: {
        create: {
          email: "farmer@test.com",
          password: "hashedpassword",
          name: "Farmer",
          phone: "+421900000003",
          role: "FARMER",
          ...baseAddress,
        },
      },
    },
  });

  const farmProduct = await prisma.farmProduct.create({
    data: {
      farm: { connect: { id: farm.id } },
      price: 5.5,
      stock: 10,
      product: {
        create: {
          name: "Test Product",
          category: "Fruits",
          description: "Delicious test product",
          basePrice: 5.5,
        },
      },
    },
    include: { product: true },
  });

  productId = farmProduct.product.id;
});

afterAll(async () => {
  await prisma.review.deleteMany({});
  await prisma.farmProduct.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.farm.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("Review Routes", () => {
  it("POST /review - should create review", async () => {
    const res = await request(app)
      .post("/api/review")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({ productId, rating: 4, comment: "Great product!" });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.rating).toBe(4);
    reviewId = res.body.id;
  });

  it("GET /review/product/:productId - should get reviews for product", async () => {
    const res = await request(app)
      .get(`/api/review/product/${productId}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const review = res.body.find((r: any) => r.id === reviewId);
    expect(review.user.id).toBe(USER_ID);
  });

  it("PUT /review/:id - should update own review", async () => {
    const res = await request(app)
      .put(`/api/review/${reviewId}`)
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({ rating: 5, comment: "Updated comment" });

    expect(res.statusCode).toBe(200);
    expect(res.body.rating).toBe(5);
    expect(res.body.comment).toBe("Updated comment");
  });

  it("PUT /review/:id - should fail for other user", async () => {
    const res = await request(app)
      .put(`/api/review/${reviewId}`)
      .set("Cookie", [`accessToken=${otherAccessToken}`])
      .send({ rating: 3, comment: "Hack attempt" });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error", "Not authorized");
  });

  it("DELETE /review/:id - should delete own review", async () => {
    const res = await request(app)
      .delete(`/api/review/${reviewId}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Review deleted");

    const check = await prisma.review.findUnique({ where: { id: reviewId } });
    expect(check).toBeNull();
  });

  it("POST /review - should fail without token", async () => {
    const res = await request(app)
      .post("/api/review")
      .send({ productId, rating: 4 });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Access token missing");
  });

  it("POST /review - should fail with invalid rating", async () => {
    const res = await request(app)
      .post("/api/review")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({ productId, rating: 10 });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid request data");
  });
});
