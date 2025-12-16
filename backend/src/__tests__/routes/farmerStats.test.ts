process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ?? "access-secret";

import request from "supertest";
import jwt from "jsonwebtoken";
import {
  OrderItemStatus,
  OrderType,
  PaymentMethod,
  ProductCategory,
  Role,
} from "@prisma/client";
import app from "../../index.ts";
import prisma from "../../prisma.ts";

describe("Farmer stats routes", () => {
  const baseAddress = {
    address: "Main Street 1",
    postalCode: "01001",
    city: "Bratislava",
    country: "Slovakia",
  };

  let farmerToken: string;
  let emptyFarmerToken: string;
  let customerToken: string;
  let productAId: number;
  let productBId: number;
  let productAName: string;
  let productBName: string;

  beforeAll(async () => {
    await prisma.orderHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.eventProduct.deleteMany({});
    await prisma.eventParticipant.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.farmProduct.deleteMany({});
    await prisma.farm.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});

    const emptyFarmer = await prisma.user.create({
      data: {
        email: "stats-empty-farmer@test.com",
        password: "hashedpassword",
        name: "Empty Farmer",
        phone: "+421900000001",
        role: Role.FARMER,
        ...baseAddress,
      },
    });
    emptyFarmerToken = jwt.sign(
      { id: emptyFarmer.id, role: Role.FARMER },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "1h" }
    );

    const farmer = await prisma.user.create({
      data: {
        email: "stats-farmer@test.com",
        password: "hashedpassword",
        name: "Stat Farmer",
        phone: "+421900000002",
        role: Role.FARMER,
        ...baseAddress,
      },
    });
    farmerToken = jwt.sign(
      { id: farmer.id, role: Role.FARMER },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "1h" }
    );

    const customer = await prisma.user.create({
      data: {
        email: "stats-customer@test.com",
        password: "hashedpassword",
        name: "Stats Customer",
        phone: "+421900000003",
        role: Role.CUSTOMER,
        ...baseAddress,
      },
    });
    customerToken = jwt.sign(
      { id: customer.id, role: Role.CUSTOMER },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: "1h" }
    );

    const farm = await prisma.farm.create({
      data: {
        name: "Stats Farm",
        description: "Farm for stats tests",
        city: "Bratislava",
        street: "Market 1",
        region: "Bratislavský",
        postalCode: "81101",
        country: "Slovakia",
        farmerId: farmer.id,
      },
    });

    const productA = await prisma.product.create({
      data: {
        name: "Stats Apples",
        category: ProductCategory.Fruits,
        description: "Crunchy apples",
        basePrice: 5,
      },
    });
    productAId = productA.id;
    productAName = productA.name;

    const productB = await prisma.product.create({
      data: {
        name: "Stats Cheese",
        category: ProductCategory.Dairy,
        description: "Fresh cheese",
        basePrice: 7,
      },
    });
    productBId = productB.id;
    productBName = productB.name;

    await prisma.farmProduct.create({
      data: {
        farmId: farm.id,
        productId: productA.id,
        price: 5.5,
        stock: 40,
      },
    });

    const now = new Date();
    const event = await prisma.event.create({
      data: {
        title: "Stats Event",
        description: "Event for stats",
        startDate: now,
        endDate: new Date(now.getTime() + 60 * 60 * 1000),
        city: "Nitra",
        street: "Event Street",
        region: "Nitriansky",
        postalCode: "94901",
        country: "Slovakia",
        organizerId: farmer.id,
      },
    });

    await prisma.eventProduct.create({
      data: {
        eventId: event.id,
        productId: productB.id,
        userId: farmer.id,
        price: 7,
        stock: 30,
      },
    });

    await prisma.order.create({
      data: {
        buyerId: customer.id,
        contactName: "Standard Buyer",
        contactPhone: "+421900000111",
        orderType: OrderType.STANDARD,
        deliveryCity: "Bratislava",
        deliveryStreet: "Market 1",
        deliveryPostalCode: "81101",
        deliveryCountry: "Slovakia",
        paymentMethod: PaymentMethod.CASH,
        totalPrice: 20,
        isPaid: true,
        items: {
          create: [
            {
              productId: productA.id,
              productName: productA.name,
              farmerId: farmer.id,
              quantity: 2,
              unitPrice: 10,
              sellerName: "Stat Farmer",
              status: OrderItemStatus.ACTIVE,
            },
          ],
        },
      },
    });

    await prisma.order.create({
      data: {
        contactName: "Preorder Buyer",
        contactPhone: "+421900000222",
        orderType: OrderType.PREORDER,
        deliveryCity: "Nitra",
        deliveryStreet: "Event Street",
        deliveryPostalCode: "94901",
        deliveryCountry: "Slovakia",
        paymentMethod: PaymentMethod.CARD,
        totalPrice: 21,
        eventId: event.id,
        items: {
          create: [
            {
              productId: productB.id,
              productName: productB.name,
              farmerId: farmer.id,
              quantity: 3,
              unitPrice: 7,
              sellerName: "Stat Farmer",
              status: OrderItemStatus.ACTIVE,
            },
          ],
        },
      },
    });

    await prisma.order.create({
      data: {
        contactName: "Canceled Order",
        contactPhone: "+421900000333",
        orderType: OrderType.STANDARD,
        deliveryCity: "Trnava",
        deliveryStreet: "Side 9",
        deliveryPostalCode: "91701",
        deliveryCountry: "Slovakia",
        paymentMethod: PaymentMethod.CASH,
        totalPrice: 0,
        items: {
          create: [
            {
              productId: productA.id,
              productName: productA.name,
              farmerId: farmer.id,
              quantity: 5,
              unitPrice: 4,
              sellerName: "Stat Farmer",
              status: OrderItemStatus.CANCELED,
            },
          ],
        },
      },
    });

    await prisma.review.createMany({
      data: [
        {
          rating: 5,
          comment: "Great cheese",
          userId: customer.id,
          productId: productB.id,
        },
        {
          rating: 4,
          comment: "Good apples",
          userId: customer.id,
          productId: productA.id,
        },
        {
          rating: 5,
          comment: "Excellent apples",
          userId: customer.id,
          productId: productA.id,
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.orderHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.eventProduct.deleteMany({});
    await prisma.eventParticipant.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.farmProduct.deleteMany({});
    await prisma.farm.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("should require authentication", async () => {
    const res = await request(app).get("/api/farmer-stats");
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Access token missing");
  });

  it("should forbid non-farmer role", async () => {
    const res = await request(app)
      .get("/api/farmer-stats")
      .set("Cookie", [`accessToken=${customerToken}`]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("message", "Access denied");
  });

  it("should return zeros for farmer without products", async () => {
    const res = await request(app)
      .get("/api/farmer-stats")
      .set("Cookie", [`accessToken=${emptyFarmerToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body.totals).toEqual({
      orders: 0,
      preorders: 0,
      totalRevenue: 0,
      standardRevenue: 0,
      preorderRevenue: 0,
      itemsSold: 0,
      avgTicket: 0,
    });
    expect(res.body.bestSellers).toEqual([]);
    expect(res.body.ratings).toMatchObject({
      average: null,
      totalReviews: 0,
    });
  });

  it("should aggregate orders, revenue, best sellers and ratings", async () => {
    const res = await request(app)
      .get("/api/farmer-stats")
      .set("Cookie", [`accessToken=${farmerToken}`]);

    expect(res.statusCode).toBe(200);

    const { totals, bestSellers, ratings } = res.body;

    expect(totals.orders).toBe(1);
    expect(totals.preorders).toBe(1);
    expect(totals.standardRevenue).toBe(20);
    expect(totals.preorderRevenue).toBe(21);
    expect(totals.totalRevenue).toBe(41);
    expect(totals.itemsSold).toBe(5);
    expect(totals.avgTicket).toBeCloseTo(20.5);

    expect(bestSellers.length).toBe(2);
    expect(bestSellers[0]).toMatchObject({
      productId: productBId,
      name: productBName,
      quantity: 3,
      revenue: 21,
    });
    expect(bestSellers[1]).toMatchObject({
      productId: productAId,
      name: productAName,
      quantity: 2,
      revenue: 20,
    });

    expect(ratings.totalReviews).toBe(3);
    expect(ratings.average).toBeCloseTo(14 / 3);
    expect(ratings.topRated[0]).toMatchObject({
      productId: productBId,
      name: productBName,
      averageRating: 5,
      reviewCount: 1,
    });
    expect(ratings.topRated[1]).toMatchObject({
      productId: productAId,
      name: productAName,
      averageRating: 4.5,
      reviewCount: 2,
    });
  });
});
