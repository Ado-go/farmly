import request from "supertest";
import app from "../../index";
import prisma from "../../prisma";

let CUSTOMER_ID: number;
let EVENT_ID: number;
let PRODUCT_ID: number;

beforeAll(async () => {
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  const customer = await prisma.user.create({
    data: {
      email: "customer2@test.com",
      password: "hashedpassword",
      name: "Customer 2",
      phone: "+421900000333",
      role: "CUSTOMER",
    },
  });
  CUSTOMER_ID = customer.id;

  const event = await prisma.event.create({
    data: {
      title: "Market Day",
      description: "Test event",
      startDate: new Date(),
      endDate: new Date(),
      city: "Trnava",
      street: "Market 1",
      region: "Trnavský",
      postalCode: "91701",
      country: "Slovensko",
      organizerId: CUSTOMER_ID,
    },
  });
  EVENT_ID = event.id;

  const product = await prisma.product.create({
    data: {
      name: "Honey Jar",
      category: "Sweets",
      description: "Natural honey",
      basePrice: 8,
    },
  });
  PRODUCT_ID = product.id;
});

afterAll(async () => {
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.event.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("Preorder Checkout Routes", () => {
  it("POST /checkout-preorder - should create preorder for logged-in user", async () => {
    const res = await request(app)
      .post("/api/checkout-preorder")
      .send({
        cartItems: [
          {
            productId: PRODUCT_ID,
            quantity: 1,
            unitPrice: 8,
            productName: "Honey Jar",
            sellerName: "Farmer A",
          },
        ],
        userInfo: {
          buyerId: CUSTOMER_ID,
          email: null,
        },
        eventId: EVENT_ID,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("orderId");
    expect(res.body).toHaveProperty("message", "Preorder created");
  });

  it("POST /checkout-preorder - should fail if preorder cart is empty", async () => {
    const res = await request(app)
      .post("/api/checkout-preorder")
      .send({
        cartItems: [],
        userInfo: { email: "test@test.com" },
        eventId: EVENT_ID,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid request data");
    expect(res.body.details[0].message).toBe("Cart cannot be empty");
  });

  it("POST /checkout-preorder - should fail if missing user info", async () => {
    const res = await request(app)
      .post("/api/checkout-preorder")
      .send({
        cartItems: [{ productId: PRODUCT_ID, quantity: 1, unitPrice: 8 }],
        eventId: EVENT_ID,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid request data");
    expect(res.body.details.some((d: any) => d.path === "userInfo")).toBe(true);
  });

  it("POST /checkout-preorder - should fail if missing both buyerId and email", async () => {
    const res = await request(app)
      .post("/api/checkout-preorder")
      .send({
        cartItems: [
          {
            productId: PRODUCT_ID,
            quantity: 1,
            unitPrice: 8,
            productName: "Honey Jar",
            sellerName: "Farmer A",
          },
        ],
        userInfo: {
          deliveryCity: "Trnava",
          deliveryStreet: "No Name 3",
          deliveryRegion: "Trnavský",
          deliveryPostalCode: "91701",
          deliveryCountry: "Slovensko",
          paymentMethod: "CASH",
        },
        eventId: EVENT_ID,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid request data");
    expect(
      res.body.details.some((d: any) =>
        d.message.includes("Either buyerId or email")
      )
    ).toBe(true);
  });

  it("POST /checkout-preorder - should fail if eventId is missing", async () => {
    const res = await request(app)
      .post("/api/checkout-preorder")
      .send({
        cartItems: [
          {
            productId: PRODUCT_ID,
            quantity: 1,
            unitPrice: 8,
            productName: "Honey Jar",
            sellerName: "Farmer A",
          },
        ],
        userInfo: { email: "abc@test.com" },
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid request data");
    expect(res.body.details[0].path).toBe("eventId");
  });
});
