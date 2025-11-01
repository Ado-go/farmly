process.env.NODE_ENV = "test";

import request from "supertest";
import prisma from "../../prisma.ts";
import app from "../../index.ts";
import jwt from "jsonwebtoken";

let token: string;
let offerId: number;
let farmerId: number;

beforeAll(async () => {
  await prisma.offer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  const user = await prisma.user.create({
    data: {
      email: "offerfarmer@test.com",
      password: "hashedpassword",
      name: "Offer Farmer",
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
  await prisma.offer.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("Offer routes", () => {
  it("should create an offer and product", async () => {
    const res = await request(app)
      .post("/api/offer")
      .set("Cookie", [`accessToken=${token}`])
      .send({
        title: "Čerstvé jablká",
        description: "Sladké jablká z domácej farmy",
        category: "Ovocie",
        price: 3.5,
        imageUrl: "https://example.com/jablka.jpg",
        product: {
          name: "Jablká",
          category: "Ovocie",
          description: "Zdravé, čerstvo zozbierané jablká",
          basePrice: 2.5,
        },
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("Čerstvé jablká");
    expect(res.body.product).toHaveProperty("id");
    expect(res.body.product.name).toBe("Jablká");
    offerId = res.body.id;
  });

  it("should get all public offers", async () => {
    const res = await request(app).get("/api/offer/all");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("product");
    expect(res.body[0]).toHaveProperty("user");
  });

  it("should get all offers of the logged-in user", async () => {
    const res = await request(app)
      .get("/api/offer/my")
      .set("Cookie", [`accessToken=${token}`]);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].userId).toBe(farmerId);
  });

  it("should update an offer", async () => {
    const res = await request(app)
      .put(`/api/offer/${offerId}`)
      .set("Cookie", [`accessToken=${token}`])
      .send({
        title: "Čerstvé jablká - nový názov",
        price: 4.0,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe("Čerstvé jablká - nový názov");
    expect(res.body.price).toBe(4.0);
  });

  it("should delete an offer", async () => {
    const res = await request(app)
      .delete(`/api/offer/${offerId}`)
      .set("Cookie", [`accessToken=${token}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Offer deleted successfully.");

    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    expect(offer).toBeNull();
  });

  it("should return 401 if no token provided", async () => {
    const res = await request(app).get("/api/offer/my");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Access token missing");
  });
});
