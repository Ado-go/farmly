process.env.NODE_ENV = "test";

import request from "supertest";
import {
  OrderItemStatus,
  OrderType,
  PaymentMethod,
  ProductCategory,
  Role,
} from "@prisma/client";
import app from "../../index.ts";
import prisma from "../../prisma.ts";

describe("Orders routes", () => {
  const baseAddress = {
    address: "Main Street 1",
    postalCode: "01001",
    city: "Bratislava",
    country: "Slovakia",
  };

  let orderNumber: string;
  let productId: number;
  let productName: string;
  let buyerEmail: string;
  let eventPayload: any;

  beforeAll(async () => {
    await prisma.orderHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.eventProduct.deleteMany({});
    await prisma.eventParticipant.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    const buyer = await prisma.user.create({
      data: {
        email: "orders-buyer@test.com",
        password: "hashedpassword",
        name: "Orders Buyer",
        phone: "+421900111111",
        role: Role.CUSTOMER,
        ...baseAddress,
      },
    });
    buyerEmail = buyer.email;

    const organizer = await prisma.user.create({
      data: {
        email: "orders-farmer@test.com",
        password: "hashedpassword",
        name: "Orders Farmer",
        phone: "+421900222222",
        role: Role.FARMER,
        ...baseAddress,
      },
    });

    const product = await prisma.product.create({
      data: {
        name: "Order Product",
        category: ProductCategory.Fruits,
        description: "Product for order lookup",
        basePrice: 15,
      },
    });
    productId = product.id;
    productName = product.name;

    const now = new Date();
    const event = await prisma.event.create({
      data: {
        title: "Order Event",
        description: "Event for order lookup",
        startDate: now,
        endDate: new Date(now.getTime() + 60 * 60 * 1000),
        city: "Bratislava",
        street: "Event Street",
        region: "Bratislavský",
        postalCode: "81101",
        country: "Slovakia",
        organizerId: organizer.id,
      },
    });
    eventPayload = {
      title: event.title,
      city: event.city,
      street: event.street,
      postalCode: event.postalCode,
      country: event.country,
    };

    const order = await prisma.order.create({
      data: {
        buyerId: buyer.id,
        contactName: "Order Buyer",
        contactPhone: "+421900333333",
        orderType: OrderType.PREORDER,
        deliveryCity: "Bratislava",
        deliveryStreet: "River 1",
        deliveryPostalCode: "81101",
        deliveryCountry: "Slovakia",
        paymentMethod: PaymentMethod.CARD,
        isPaid: true,
        totalPrice: 45,
        eventId: event.id,
        items: {
          create: [
            {
              productId,
              productName,
              quantity: 3,
              unitPrice: 15,
              sellerName: "Order Seller",
              status: OrderItemStatus.ACTIVE,
            },
          ],
        },
      },
    });

    orderNumber = order.orderNumber;
  });

  afterAll(async () => {
    await prisma.orderHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.eventProduct.deleteMany({});
    await prisma.eventParticipant.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("should return an order by orderNumber with items and event", async () => {
    const res = await request(app).get(`/api/orders/${orderNumber}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      orderNumber,
      orderType: OrderType.PREORDER,
      isPaid: true,
      paymentMethod: PaymentMethod.CARD,
      contact: {
        name: "Order Buyer",
        phone: "+421900333333",
        email: buyerEmail,
      },
      event: eventPayload,
    });
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0]).toMatchObject({
      productId,
      productName,
      quantity: 3,
      unitPrice: 15,
      sellerName: "Order Seller",
      status: OrderItemStatus.ACTIVE,
    });
  });

  it("should return 404 for unknown order number", async () => {
    const res = await request(app).get("/api/orders/unknown-number");

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("message", "Order not found");
  });
});
