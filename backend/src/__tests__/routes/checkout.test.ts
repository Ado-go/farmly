import request from "supertest";
import app from "../../index";
import prisma from "../../prisma";

let CUSTOMER_ID: number;
let PRODUCT_ID: number;

beforeAll(async () => {
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  const customer = await prisma.user.create({
    data: {
      email: "customer@test.com",
      password: "hashedpassword",
      name: "Test Customer",
      phone: "+421900000123",
      role: "CUSTOMER",
    },
  });
  CUSTOMER_ID = customer.id;

  const product = await prisma.product.create({
    data: {
      name: "Test Product",
      category: "Fruits",
      description: "Fresh apples",
      basePrice: 4.5,
    },
  });
  PRODUCT_ID = product.id;
});

afterAll(async () => {
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

describe("Checkout Routes", () => {
  it("POST /checkout - should create order for logged-in user", async () => {
    const res = await request(app)
      .post("/api/checkout")
      .send({
        cartItems: [
          {
            productId: PRODUCT_ID,
            quantity: 2,
            unitPrice: 4.5,
            productName: "Test Product",
            sellerName: "Farmer A",
          },
        ],
        userInfo: {
          buyerId: CUSTOMER_ID,
          deliveryCity: "Bratislava",
          deliveryStreet: "Main 1",
          deliveryRegion: "Bratislavský",
          deliveryPostalCode: "81101",
          deliveryCountry: "Slovensko",
          paymentMethod: "CASH",
        },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("orderId");
    expect(res.body).toHaveProperty("message", "Order was successfuly created");

    const order = await prisma.order.findUnique({
      where: { id: res.body.orderId },
      include: { items: true },
    });
    expect(order?.buyerId).toBe(CUSTOMER_ID);
    expect(order?.items.length).toBe(1);
    expect(order?.items[0].productName).toBe("Test Product");
  });

  it("POST /checkout - should create order for anonymous user with email", async () => {
    const res = await request(app)
      .post("/api/checkout")
      .send({
        cartItems: [
          {
            productId: PRODUCT_ID,
            quantity: 1,
            unitPrice: 4.5,
            productName: "Test Product",
            sellerName: "Farmer B",
          },
        ],
        userInfo: {
          email: "anon@test.com",
          deliveryCity: "Košice",
          deliveryStreet: "Long 12",
          deliveryRegion: "Košický",
          deliveryPostalCode: "04001",
          deliveryCountry: "Slovensko",
          paymentMethod: "CARD",
        },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("orderId");

    const order = await prisma.order.findUnique({
      where: { id: res.body.orderId },
    });
    expect(order?.anonymousEmail).toBe("anon@test.com");
    expect(order?.buyerId).toBeNull();
  });

  it("POST /checkout - should fail if cart is empty", async () => {
    const res = await request(app)
      .post("/api/checkout")
      .send({
        cartItems: [],
        userInfo: { email: "test@test.com", paymentMethod: "CASH" },
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Cart is empty");
  });

  it("POST /checkout - should fail if missing userInfo", async () => {
    const res = await request(app)
      .post("/api/checkout")
      .send({
        cartItems: [{ productId: PRODUCT_ID, quantity: 1, unitPrice: 4.5 }],
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Missing user info");
  });

  it("POST /checkout - should fail if missing both buyerId and email", async () => {
    const res = await request(app)
      .post("/api/checkout")
      .send({
        cartItems: [{ productId: PRODUCT_ID, quantity: 1, unitPrice: 4.5 }],
        userInfo: {
          deliveryCity: "Nitra",
          deliveryStreet: "Short 3",
          deliveryRegion: "Nitriansky",
          deliveryPostalCode: "94901",
          deliveryCountry: "Slovensko",
          paymentMethod: "BANK_TRANSFER",
        },
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Enter an email to finish order"
    );
  });
});
