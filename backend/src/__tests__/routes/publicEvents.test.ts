process.env.NODE_ENV = "test";

import request from "supertest";
import app from "../../index.ts";
import prisma from "../../prisma.ts";

let farmerId: number;
let eventCurrentId: number;
let eventFutureId: number;
let eventPastId: number;
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
      email: "publiceventfarmer@test.com",
      password: "hashedpassword",
      name: "Event Farmer",
      phone: "+421900555555",
      role: "FARMER",
      ...baseAddress,
    },
  });

  farmerId = farmer.id;

  const product1 = await prisma.product.create({
    data: {
      name: "Organic Apples",
      category: "Fruits",
      description: "Fresh organic apples from the orchard",
      basePrice: 2.5,
    },
  });

  const product2 = await prisma.product.create({
    data: {
      name: "Homemade Cheese",
      category: "Dairy",
      description: "Soft goat cheese made locally",
      basePrice: 5.0,
    },
  });

  const now = new Date();

  const eventCurrent = await prisma.event.create({
    data: {
      title: "Farmársky trh Bratislava",
      description: "Tradičný trh s lokálnymi výrobkami",
      startDate: new Date(now.getTime() - 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 2 * 60 * 60 * 1000),
      city: "Bratislava",
      street: "Main Square",
      region: "Bratislavský",
      postalCode: "81101",
      country: "Slovakia",
      organizerId: farmerId,
      eventProducts: {
        create: [
          { productId: product1.id, userId: farmerId },
          { productId: product2.id, userId: farmerId },
        ],
      },
    },
  });

  eventCurrentId = eventCurrent.id;

  const eventFuture = await prisma.event.create({
    data: {
      title: "Jesenné farmárske dni Nitra",
      description: "Degustácie a workshopy o lokálnych produktoch",
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
      city: "Nitra",
      street: "Hlavná 12",
      region: "Nitriansky",
      postalCode: "94901",
      country: "Slovakia",
      organizerId: farmerId,
      eventProducts: {
        create: [{ productId: product2.id, userId: farmerId }],
      },
    },
  });

  eventFutureId = eventFuture.id;

  const eventPast = await prisma.event.create({
    data: {
      title: "Letný trh Košice",
      description: "Letné produkty od slovenských farmárov",
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000),
      city: "Košice",
      street: "Trhová 5",
      region: "Košický",
      postalCode: "04001",
      country: "Slovakia",
      organizerId: farmerId,
    },
  });

  eventPastId = eventPast.id;
});

afterAll(async () => {
  await prisma.eventProduct.deleteMany({});
  await prisma.eventParticipant.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("Public Events Routes", () => {
  it("GET /public-events - should return only current and future events", async () => {
    const res = await request(app).get("/api/public-events");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    const items = res.body.items;

    const titles = items.map((e: any) => e.title);

    expect(titles).toContain("Farmársky trh Bratislava");
    expect(titles).toContain("Jesenné farmárske dni Nitra");
    expect(titles).not.toContain("Letný trh Košice");

    const event = items.find(
      (e: any) => e.title === "Farmársky trh Bratislava"
    );
    expect(event.organizer).toHaveProperty("name", "Event Farmer");
    expect(event.eventProducts.length).toBeGreaterThan(0);
    expect(event.eventProducts[0].product).toHaveProperty("name");
  });

  it("GET /public-events/:id - should return a specific event with products", async () => {
    const res = await request(app).get(`/api/public-events/${eventFutureId}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("id", eventFutureId);
    expect(res.body).toHaveProperty("title", "Jesenné farmárske dni Nitra");
    expect(res.body.organizer.name).toBe("Event Farmer");

    const hasCheese = res.body.eventProducts.some(
      (p: any) => p.product.name === "Homemade Cheese"
    );
    expect(hasCheese).toBe(true);
  });

  it("GET /public-events/:id - should return 400 for invalid ID", async () => {
    const res = await request(app).get("/api/public-events/invalid");
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Invalid event ID");
  });

  it("GET /public-events/:id - should return 404 for non-existing event", async () => {
    const res = await request(app).get("/api/public-events/999999");
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Event not found");
  });
});
