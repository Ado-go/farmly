process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ?? "access-secret";

import request from "supertest";
import app from "../../index.ts";
import prisma from "../../prisma.ts";
import jwt from "jsonwebtoken";

describe("EventProduct Routes", () => {
  let FARMER_ID: number;
  let OTHER_FARMER_ID: number;
  let EVENT_ID: number;
  let OTHER_EVENT_ID: number;
  let eventProductId: number;
  let accessToken: string;
  let otherAccessToken: string;
  const baseAddress = {
    address: "Main Street 1",
    postalCode: "01001",
    city: "Bratislava",
    country: "Slovakia",
  };

  beforeAll(async () => {
    await prisma.eventProduct.deleteMany({});
    await prisma.eventParticipant.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    const farmer = await prisma.user.create({
      data: {
        email: "farmer@test.com",
        password: "hashedpassword",
        name: "Farmer",
        phone: "+421900000001",
        role: "FARMER",
        ...baseAddress,
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
        ...baseAddress,
      },
    });
    OTHER_FARMER_ID = otherFarmer.id;
    otherAccessToken = jwt.sign(
      { id: OTHER_FARMER_ID, role: "FARMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const event = await prisma.event.create({
      data: {
        title: "Green Market",
        description: "Eco-friendly event",
        startDate: new Date(),
        endDate: new Date(),
        city: "Bratislava",
        street: "Market Street 5",
        region: "Bratislavský",
        postalCode: "81101",
        country: "Slovakia",
        organizerId: FARMER_ID,
      },
    });
    EVENT_ID = event.id;

    const otherEvent = await prisma.event.create({
      data: {
        title: "Autumn Harvest",
        description: "Organic harvest fair",
        startDate: new Date(),
        endDate: new Date(),
        city: "Košice",
        street: "Harvest Road 10",
        region: "Košický",
        postalCode: "04001",
        country: "Slovakia",
        organizerId: OTHER_FARMER_ID,
      },
    });
    OTHER_EVENT_ID = otherEvent.id;

    await prisma.eventParticipant.create({
      data: { eventId: EVENT_ID, userId: FARMER_ID },
    });
    await prisma.eventParticipant.create({
      data: { eventId: EVENT_ID, userId: OTHER_FARMER_ID },
    });

    await prisma.eventParticipant.create({
      data: { eventId: OTHER_EVENT_ID, userId: OTHER_FARMER_ID },
    });
  });

  afterAll(async () => {
    await prisma.eventProduct.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.eventParticipant.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("POST /event-product - should create event product for own participation", async () => {
    const res = await request(app)
      .post("/api/event-product")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        name: "Event Product",
        category: "Fruits",
        description: "Fresh apples",
        basePrice: 5,
        eventId: EVENT_ID,
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.product).toHaveProperty("name", "Event Product");
    eventProductId = res.body.id;
  });

  it("POST /event-product - should fail for non-participating event", async () => {
    const res = await request(app)
      .post("/api/event-product")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        name: "Invalid Event Product",
        category: "Vegetables",
        description: "Should not work",
        basePrice: 3,
        eventId: OTHER_EVENT_ID,
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("GET /event-product/event/:id - should list all products of event for participant", async () => {
    const res = await request(app)
      .get(`/api/event-product/event/${EVENT_ID}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].product).toHaveProperty("name", "Event Product");
  });

  it("GET /event-product/event/:id - should fail if not participant", async () => {
    const res = await request(app)
      .get(`/api/event-product/event/${OTHER_EVENT_ID}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("PUT /event-product/:id - should update own event product", async () => {
    const res = await request(app)
      .put(`/api/event-product/${eventProductId}`)
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        name: "Updated Event Product",
        description: "Now even fresher!",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.product).toHaveProperty("name", "Updated Event Product");
  });

  it("PUT /event-product/:id - should fail to update another farmer's product", async () => {
    const res = await request(app)
      .put(`/api/event-product/${eventProductId}`)
      .set("Cookie", [`accessToken=${otherAccessToken}`])
      .send({ name: "Unauthorized Update" });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("DELETE /event-product/:id - should delete own event product", async () => {
    const productToDelete = await prisma.eventProduct.create({
      data: {
        event: { connect: { id: EVENT_ID } },
        user: { connect: { id: FARMER_ID } },
        product: {
          create: {
            name: "Temp Product",
            category: "Meat",
            description: "Temporary",
          },
        },
      },
    });

    const res = await request(app)
      .delete(`/api/event-product/${productToDelete.id}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Event product deleted");
  });

  it("DELETE /event-product/:id - should fail to delete another farmer's product", async () => {
    const otherProduct = await prisma.eventProduct.create({
      data: {
        event: { connect: { id: EVENT_ID } },
        user: { connect: { id: OTHER_FARMER_ID } },
        product: {
          create: {
            name: "Other Farmer Product",
            category: "Vegetables",
            description: "Owned by other farmer",
          },
        },
      },
    });

    const res = await request(app)
      .delete(`/api/event-product/${otherProduct.id}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error");
  });

  it("DELETE /event-product/event/:eventId - should delete all own event products", async () => {
    await prisma.eventProduct.create({
      data: {
        event: { connect: { id: EVENT_ID } },
        user: { connect: { id: FARMER_ID } },
        product: {
          create: {
            name: "Bulk Product 1",
            category: "Fruits",
            description: "Batch test",
          },
        },
      },
    });

    await prisma.eventProduct.create({
      data: {
        event: { connect: { id: EVENT_ID } },
        user: { connect: { id: FARMER_ID } },
        product: {
          create: {
            name: "Bulk Product 2",
            category: "Vegetables",
            description: "Batch test 2",
          },
        },
      },
    });

    const res = await request(app)
      .delete(`/api/event-product/event/${EVENT_ID}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "All your event products deleted"
    );
  });

  it("GET /event-product/event/:id - should return 401 without token", async () => {
    const res = await request(app).get(`/api/event-product/event/${EVENT_ID}`);
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Access token missing");
  });
});
