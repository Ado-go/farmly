process.env.NODE_ENV = "test";

import request from "supertest";
import { OrderType, PaymentMethod, Role } from "@prisma/client";
import app from "../../index.ts";
import prisma from "../../prisma.ts";

describe("Public stats routes", () => {
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
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.orderHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("should return total farmers, orders and preorders", async () => {
    await prisma.user.createMany({
      data: [
        {
          email: "public-stats-farmer1@test.com",
          password: "hashedpassword",
          name: "Public Farmer 1",
          phone: "+421900444444",
          role: Role.FARMER,
          ...baseAddress,
        },
        {
          email: "public-stats-farmer2@test.com",
          password: "hashedpassword",
          name: "Public Farmer 2",
          phone: "+421900555555",
          role: Role.FARMER,
          ...baseAddress,
        },
      ],
    });

    await prisma.order.create({
      data: {
        contactName: "Standard Buyer",
        contactPhone: "+421900123123",
        orderType: OrderType.STANDARD,
        deliveryCity: "Bratislava",
        deliveryStreet: "Main 1",
        deliveryPostalCode: "81101",
        deliveryCountry: "Slovakia",
        paymentMethod: PaymentMethod.CASH,
      },
    });

    await prisma.order.create({
      data: {
        contactName: "Preorder Buyer",
        contactPhone: "+421900321321",
        orderType: OrderType.PREORDER,
        deliveryCity: "Nitra",
        deliveryStreet: "Side 2",
        deliveryPostalCode: "94901",
        deliveryCountry: "Slovakia",
        paymentMethod: PaymentMethod.CARD,
      },
    });

    const res = await request(app).get("/api/public-stats");

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      farmers: 2,
      orders: 1,
      preorders: 1,
    });
  });
});
