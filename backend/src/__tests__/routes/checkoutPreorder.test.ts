process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ?? "access-secret";

import request from "supertest";
import app from "../../index.ts";
import prisma from "../../prisma.ts";
import jwt from "jsonwebtoken";

describe("Preorder Checkout Routes", () => {
  let CUSTOMER_ID: number;
  let EVENT_ID: number;
  let PRODUCT_ID: number;
  let CUSTOMER_TOKEN: string;
  const baseAddress = {
    address: "Main Street 1",
    postalCode: "01001",
    city: "Bratislava",
    country: "Slovakia",
  };

  beforeAll(async () => {
    await prisma.orderHistory.deleteMany({});
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
        ...baseAddress,
      },
    });
    CUSTOMER_ID = customer.id;
    CUSTOMER_TOKEN = jwt.sign(
      { id: CUSTOMER_ID, role: "CUSTOMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

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
        category: "Other",
        description: "Natural honey",
        basePrice: 8,
      },
    });
    PRODUCT_ID = product.id;

    await prisma.eventProduct.create({
      data: {
        eventId: EVENT_ID,
        productId: PRODUCT_ID,
        userId: CUSTOMER_ID,
        price: 8,
        stock: 100,
      },
    });
  });

  beforeEach(async () => {
    await prisma.orderHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.eventProduct.updateMany({
      where: { eventId: EVENT_ID, productId: PRODUCT_ID },
      data: { stock: 100 },
    });
  });

  afterAll(async () => {
    await prisma.orderHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

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
          contactName: "Customer 2",
          contactPhone: "+421900000333",
          email: "customer2@test.com",
        },
        eventId: EVENT_ID,
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("orderId");
    expect(res.body).toHaveProperty("message", "Preorder created");

    const eventProduct = await prisma.eventProduct.findFirst({
      where: { eventId: EVENT_ID, productId: PRODUCT_ID },
    });
    expect(eventProduct?.stock).toBe(99);
  });

  it("POST /checkout-preorder - fails when stock is insufficient", async () => {
    await prisma.eventProduct.updateMany({
      where: { eventId: EVENT_ID, productId: PRODUCT_ID },
      data: { stock: 0 },
    });

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
          contactName: "Customer 2",
          contactPhone: "+421900000333",
          email: "customer2@test.com",
        },
        eventId: EVENT_ID,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Insufficient stock for some products");
  });

  it("POST /checkout-preorder - should fail if preorder cart is empty", async () => {
    const res = await request(app)
      .post("/api/checkout-preorder")
      .send({
        cartItems: [],
        userInfo: {
          email: "test@test.com",
          contactName: "Tester",
          contactPhone: "+421900000123",
        },
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
          contactName: "Tester",
          contactPhone: "+421900000123",
          deliveryCity: "Trnava",
          deliveryStreet: "No Name 3",
          deliveryPostalCode: "91701",
          deliveryCountry: "Slovensko",
          paymentMethod: "CASH",
        },
        eventId: EVENT_ID,
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid request data");
    expect(res.body.details.some((d: any) => String(d.path).includes("email"))).toBe(true);
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
        userInfo: {
          email: "abc@test.com",
          contactName: "Tester",
          contactPhone: "+421900000123",
        },
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe("Invalid request data");
    expect(res.body.details[0].path).toBe("eventId");
  });

  it("PATCH /checkout-preorder/:id/cancel - should block cancel after event end", async () => {
    const pastEvent = await prisma.event.create({
      data: {
        title: "Finished Event",
        description: "Ended already",
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 6),
        endDate: new Date(Date.now() - 1000 * 60 * 60),
        city: "Trnava",
        street: "Market 1",
        region: "Trnavský",
        postalCode: "91701",
        country: "Slovensko",
        organizerId: CUSTOMER_ID,
      },
    });

    const order = await prisma.order.create({
      data: {
        buyerId: CUSTOMER_ID,
        orderType: "PREORDER",
        contactName: "Customer 2",
        contactPhone: "+421900000333",
        deliveryCity: "Trnava",
        deliveryStreet: "Market 1",
        deliveryPostalCode: "91701",
        deliveryCountry: "Slovensko",
        eventId: pastEvent.id,
        isDelivered: false,
        isPaid: false,
        paymentMethod: "CASH",
        totalPrice: 10,
        status: "PENDING",
      },
    });

    await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: PRODUCT_ID,
        farmerId: CUSTOMER_ID,
        quantity: 1,
        unitPrice: 10,
        sellerName: "Seller",
        productName: "Honey Jar",
        status: "ACTIVE",
      },
    });

    const res = await request(app)
      .patch(`/api/checkout-preorder/${order.id}/cancel`)
      .set("Cookie", [`accessToken=${CUSTOMER_TOKEN}`]);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      "Preorders cannot be canceled after the event has ended"
    );

    const persistedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });

    expect(persistedOrder?.status).toBe("PENDING");
    expect(
      persistedOrder?.items.every((item) => item.status === "ACTIVE")
    ).toBe(true);
  });

  it("PATCH /checkout-preorder/item/:id/cancel - should block farmer cancel after event end", async () => {
    const farmer = await prisma.user.create({
      data: {
        email: "farmercancel@test.com",
        password: "hashedpassword",
        name: "Farmer Cancel",
        phone: "+421900000444",
        role: "FARMER",
        ...baseAddress,
      },
    });
    const farmerToken = jwt.sign(
      { id: farmer.id, role: "FARMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const pastEvent = await prisma.event.create({
      data: {
        title: "Past Event",
        description: "Cannot cancel after this",
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 5),
        endDate: new Date(Date.now() - 1000 * 60 * 60),
        city: "Nitra",
        street: "Old Street 2",
        region: "Nitriansky",
        postalCode: "94901",
        country: "Slovensko",
        organizerId: farmer.id,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Jam",
        category: "Other",
        description: "Sweet jam",
        basePrice: 5,
      },
    });

    await prisma.eventProduct.create({
      data: {
        eventId: pastEvent.id,
        productId: product.id,
        userId: farmer.id,
        price: 5,
        stock: 10,
      },
    });

    const order = await prisma.order.create({
      data: {
        buyerId: CUSTOMER_ID,
        orderType: "PREORDER",
        contactName: "Customer 2",
        contactPhone: "+421900000333",
        deliveryCity: "Nitra",
        deliveryStreet: "Old Street 2",
        deliveryPostalCode: "94901",
        deliveryCountry: "Slovensko",
        eventId: pastEvent.id,
        isDelivered: false,
        isPaid: false,
        paymentMethod: "CASH",
        totalPrice: 12,
        status: "PENDING",
      },
    });

    const item = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        farmerId: farmer.id,
        quantity: 2,
        unitPrice: 6,
        sellerName: farmer.name,
        productName: "Jam",
        status: "ACTIVE",
      },
    });

    const res = await request(app)
      .patch(`/api/checkout-preorder/item/${item.id}/cancel`)
      .set("Cookie", [`accessToken=${farmerToken}`]);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe(
      "Farmer cannot cancel items after the event has ended"
    );

    const persistedItem = await prisma.orderItem.findUnique({
      where: { id: item.id },
    });

    expect(persistedItem?.status).toBe("ACTIVE");
  });

  it("PATCH /checkout-preorder/item/:id/cancel - cancels last item and whole preorder", async () => {
    const farmer = await prisma.user.create({
      data: {
        email: "preorderfarmer@test.com",
        password: "hashedpassword",
        name: "Preorder Farmer",
        phone: "+421900000555",
        role: "FARMER",
        ...baseAddress,
      },
    });
    const farmerToken = jwt.sign(
      { id: farmer.id, role: "FARMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const event = await prisma.event.create({
      data: {
        title: "Future Event",
        description: "Cancelable items",
        startDate: new Date(Date.now() + 1000 * 60 * 30),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 2),
        city: "Žilina",
        street: "Future 1",
        region: "Žilinský",
        postalCode: "01001",
        country: "Slovensko",
        organizerId: farmer.id,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Cheese",
        category: "Other",
        description: "Fresh cheese",
        basePrice: 6,
      },
    });

    await prisma.eventProduct.create({
      data: {
        eventId: event.id,
        productId: product.id,
        userId: farmer.id,
        price: 6,
        stock: 5,
      },
    });

    const order = await prisma.order.create({
      data: {
        buyerId: CUSTOMER_ID,
        orderType: "PREORDER",
        contactName: "Customer 2",
        contactPhone: "+421900000333",
        deliveryCity: "Žilina",
        deliveryStreet: "Future 1",
        deliveryPostalCode: "01001",
        deliveryCountry: "Slovensko",
        eventId: event.id,
        isDelivered: false,
        isPaid: false,
        paymentMethod: "CASH",
        totalPrice: 6,
        status: "PENDING",
      },
    });

    const item = await prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: product.id,
        farmerId: farmer.id,
        quantity: 1,
        unitPrice: 6,
        sellerName: farmer.name,
        productName: product.name,
        status: "ACTIVE",
      },
    });

    const res = await request(app)
      .patch(`/api/checkout-preorder/item/${item.id}/cancel`)
      .set("Cookie", [`accessToken=${farmerToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("orderCanceled", true);
    expect(res.body).toHaveProperty("newTotalPrice", 0);

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });

    expect(updatedOrder?.status).toBe("CANCELED");
    expect(updatedOrder?.items.every((i) => i.status === "CANCELED")).toBe(
      true
    );

    const eventProduct = await prisma.eventProduct.findFirst({
      where: { eventId: event.id, productId: product.id },
    });
    expect(eventProduct?.stock).toBe(6);
  });

  it("PATCH /checkout-preorder/item/:id/cancel - keeps preorder active when other items remain", async () => {
    const farmer = await prisma.user.create({
      data: {
        email: "preorderfarmer2@test.com",
        password: "hashedpassword",
        name: "Preorder Farmer 2",
        phone: "+421900000556",
        role: "FARMER",
        ...baseAddress,
      },
    });
    const farmerToken = jwt.sign(
      { id: farmer.id, role: "FARMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const event = await prisma.event.create({
      data: {
        title: "Future Event 2",
        description: "Multiple items",
        startDate: new Date(Date.now() + 1000 * 60 * 30),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 2),
        city: "Žilina",
        street: "Future 2",
        region: "Žilinský",
        postalCode: "01001",
        country: "Slovensko",
        organizerId: farmer.id,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Milk",
        category: "Other",
        description: "Fresh milk",
        basePrice: 3,
      },
    });

    await prisma.eventProduct.create({
      data: {
        eventId: event.id,
        productId: product.id,
        userId: farmer.id,
        price: 3,
        stock: 10,
      },
    });

    const order = await prisma.order.create({
      data: {
        buyerId: CUSTOMER_ID,
        orderType: "PREORDER",
        contactName: "Customer 2",
        contactPhone: "+421900000333",
        deliveryCity: "Žilina",
        deliveryStreet: "Future 2",
        deliveryPostalCode: "01001",
        deliveryCountry: "Slovensko",
        eventId: event.id,
        isDelivered: false,
        isPaid: false,
        paymentMethod: "CASH",
        totalPrice: 6,
        status: "PENDING",
        items: {
          create: [
            {
              productId: product.id,
              farmerId: farmer.id,
              quantity: 1,
              unitPrice: 3,
              sellerName: farmer.name,
              productName: product.name,
            },
            {
              productId: product.id,
              farmerId: farmer.id,
              quantity: 1,
              unitPrice: 3,
              sellerName: farmer.name,
              productName: product.name,
            },
          ],
        },
      },
      include: { items: true },
    });

    const res = await request(app)
      .patch(`/api/checkout-preorder/item/${order.items[0].id}/cancel`)
      .set("Cookie", [`accessToken=${farmerToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("orderCanceled", false);
    expect(res.body).toHaveProperty("newTotalPrice", 3);

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });

    expect(updatedOrder?.status).toBe("PENDING");
    expect(updatedOrder?.totalPrice).toBe(3);
    expect(
      updatedOrder?.items.filter((i) => i.status === "ACTIVE").length
    ).toBe(1);

    const eventProduct = await prisma.eventProduct.findFirst({
      where: { eventId: event.id, productId: product.id },
    });
    expect(eventProduct?.stock).toBe(11);
  });
});
