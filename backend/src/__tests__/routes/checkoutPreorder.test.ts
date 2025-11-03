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
          deliveryCity: "Trnava",
          deliveryStreet: "Farm Road 7",
          deliveryRegion: "Trnavský",
          deliveryPostalCode: "91701",
          deliveryCountry: "Slovensko",
          paymentMethod: "CASH",
        },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("orderId");
    expect(res.body).toHaveProperty(
      "message",
      "Preorder was successfuly created"
    );

    const order = await prisma.order.findUnique({
      where: { id: res.body.orderId },
      include: { items: true },
    });
    expect(order?.orderType).toBe("PREORDER");
    expect(order?.items[0].productName).toBe("Honey Jar");
  });

  it("POST /checkout-preorder - should create preorder for anonymous user with email", async () => {
    const res = await request(app)
      .post("/api/checkout-preorder")
      .send({
        cartItems: [
          {
            productId: PRODUCT_ID,
            quantity: 2,
            unitPrice: 8,
            productName: "Honey Jar",
            sellerName: "Farmer B",
          },
        ],
        userInfo: {
          email: "anonpreorder@test.com",
          deliveryCity: "Trnava",
          deliveryStreet: "Market 12",
          deliveryRegion: "Trnavský",
          deliveryPostalCode: "91701",
          deliveryCountry: "Slovensko",
          paymentMethod: "CARD",
        },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("orderId");

    const order = await prisma.order.findUnique({
      where: { id: res.body.orderId },
    });
    expect(order?.anonymousEmail).toBe("anonpreorder@test.com");
  });

  it("POST /checkout-preorder - should fail if preorder cart is empty", async () => {
    const res = await request(app)
      .post("/api/checkout-preorder")
      .send({
        cartItems: [],
        userInfo: { email: "test@test.com" },
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Preorder cart is empty");
  });

  it("POST /checkout-preorder - should fail if missing user info", async () => {
    const res = await request(app)
      .post("/api/checkout-preorder")
      .send({
        cartItems: [{ productId: PRODUCT_ID, quantity: 1, unitPrice: 8 }],
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message", "Missing user info");
  });

  it("POST /checkout-preorder - should fail if missing both buyerId and email", async () => {
    const res = await request(app)
      .post("/api/checkout-preorder")
      .send({
        cartItems: [{ productId: PRODUCT_ID, quantity: 1, unitPrice: 8 }],
        userInfo: {
          deliveryCity: "Trnava",
          deliveryStreet: "No Name 3",
          deliveryRegion: "Trnavský",
          deliveryPostalCode: "91701",
          deliveryCountry: "Slovensko",
          paymentMethod: "CASH",
        },
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "Enter an email to finish order"
    );
  });
});
