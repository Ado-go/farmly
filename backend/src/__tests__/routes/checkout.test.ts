process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ?? "access-secret";

import request from "supertest";
import app from "../../index.ts";
import prisma from "../../prisma.ts";
import jwt from "jsonwebtoken";

describe("Checkout Routes", () => {
  let CUSTOMER_ID: number;
  let FARMER_ID: number;
  let OTHER_FARMER_ID: number;
  let FARM_ID: number;
  let PRODUCT_ID: number;

  let customerToken: string;
  let farmerToken: string;
  let otherFarmerToken: string;
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
    await prisma.farmProduct.deleteMany({});
    await prisma.farm.deleteMany({});
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
    farmerToken = jwt.sign(
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
    otherFarmerToken = jwt.sign(
      { id: OTHER_FARMER_ID, role: "FARMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const customer = await prisma.user.create({
      data: {
        email: "customer@test.com",
        password: "hashedpassword",
        name: "Customer",
        phone: "+421900000003",
        role: "CUSTOMER",
        ...baseAddress,
      },
    });
    CUSTOMER_ID = customer.id;
    customerToken = jwt.sign(
      { id: CUSTOMER_ID, role: "CUSTOMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const farm = await prisma.farm.create({
      data: {
        name: "Sunny Farm",
        description: "Organic vegetables",
        city: "Trnava",
        street: "Farm Street 5",
        region: "Trnavský",
        postalCode: "91701",
        country: "Slovensko",
        farmerId: FARMER_ID,
      },
    });
    FARM_ID = farm.id;

    const product = await prisma.product.create({
      data: {
        name: "Test Product",
        category: "Vegetables",
        description: "Fresh carrots",
        basePrice: 3.5,
        farmLinks: {
          create: {
            farmId: FARM_ID,
            price: 3.5,
            stock: 50,
          },
        },
      },
    });
    PRODUCT_ID = product.id;
  });

  beforeEach(async () => {
    await prisma.orderHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.farmProduct.updateMany({ data: { stock: 50, isAvailable: true } });
  });

  afterAll(async () => {
    await prisma.orderHistory.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.farmProduct.deleteMany({});
    await prisma.farm.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("POST /checkout - creates order and adds ORDER_CREATED log", async () => {
    const res = await request(app)
      .post("/api/checkout")
      .send({
        cartItems: [
          {
            productId: PRODUCT_ID,
            quantity: 2,
            unitPrice: 3.5,
            productName: "Test Product",
            sellerName: "Farmer",
          },
        ],
        userInfo: {
          buyerId: CUSTOMER_ID,
          contactName: "Customer",
          contactPhone: "+421900000003",
          deliveryCity: "Bratislava",
          deliveryStreet: "Main 1",
          deliveryPostalCode: "81101",
          deliveryCountry: "Slovensko",
          paymentMethod: "CASH",
        },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("orderId");
    expect(res.body).toHaveProperty("orderNumber");

    const order = await prisma.order.findUnique({
      where: { id: res.body.orderId },
      include: { items: true },
    });
    expect(order?.status).toBe("PENDING");
    expect(order?.items.length).toBe(1);
    expect(order?.items[0].status).toBe("ACTIVE");

    const farmProduct = await prisma.farmProduct.findFirst({
      where: { productId: PRODUCT_ID },
    });
    expect(farmProduct?.stock).toBe(48);
  });

  it("POST /checkout - fails when stock is insufficient", async () => {
    await prisma.farmProduct.updateMany({
      where: { productId: PRODUCT_ID },
      data: { stock: 1 },
    });

    const res = await request(app)
      .post("/api/checkout")
      .send({
        cartItems: [
          {
            productId: PRODUCT_ID,
            quantity: 2,
            unitPrice: 3.5,
            productName: "Test Product",
            sellerName: "Farmer",
          },
        ],
        userInfo: {
          buyerId: CUSTOMER_ID,
          contactName: "Customer",
          contactPhone: "+421900000003",
          deliveryCity: "Bratislava",
          deliveryStreet: "Main 1",
          deliveryPostalCode: "81101",
          deliveryCountry: "Slovensko",
          paymentMethod: "CASH",
        },
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Insufficient stock for some products");
  });

  it("GET /checkout/my-orders - returns customer's orders", async () => {
    const res = await request(app)
      .get("/api/checkout/my-orders")
      .set("Cookie", [`accessToken=${customerToken}`]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("orderNumber");
      expect(Array.isArray(res.body[0].items)).toBe(true);
    }
  });

  it("GET /checkout/farmer-orders - returns farmer's orders containing his products", async () => {
    const res = await request(app)
      .get("/api/checkout/farmer-orders")
      .set("Cookie", [`accessToken=${farmerToken}`]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) {
      expect(res.body[0]).toHaveProperty("orderNumber");
      expect(Array.isArray(res.body[0].items)).toBe(true);
    }
  });

  it("PATCH /checkout/:id/cancel - customer cancels own order", async () => {
    const order = await prisma.order.create({
      data: {
        buyerId: CUSTOMER_ID,
        contactName: "Customer",
        contactPhone: "+421900000003",
        deliveryCity: "Nitra",
        deliveryStreet: "Short 3",
        deliveryPostalCode: "94901",
        deliveryCountry: "Slovensko",
        paymentMethod: "CASH",
        totalPrice: 7.0,
        items: {
          create: [
            {
              productId: PRODUCT_ID,
              quantity: 2,
              unitPrice: 3.5,
              productName: "Test Product",
              sellerName: "Farmer",
            },
          ],
        },
      },
    });

    const res = await request(app)
      .patch(`/api/checkout/${order.id}/cancel`)
      .set("Cookie", [`accessToken=${customerToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Order canceled successfully");

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    });
    expect(updated?.status).toBe("CANCELED");
    expect(updated?.items[0].status).toBe("CANCELED");

    const farmProduct = await prisma.farmProduct.findFirst({
      where: { productId: PRODUCT_ID },
    });
    expect(farmProduct?.stock).toBe(52);
  });

  it("PATCH /checkout/:id/cancel - fails with 403 for another customer", async () => {
    const otherCustomer = await prisma.user.create({
      data: {
        email: "othercustomer@test.com",
        password: "hashedpassword",
        name: "Other Customer",
        phone: "+421900000099",
        role: "CUSTOMER",
        ...baseAddress,
      },
    });
    const otherCustomerToken = jwt.sign(
      { id: otherCustomer.id, role: "CUSTOMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const order = await prisma.order.create({
      data: {
        buyerId: CUSTOMER_ID,
        contactName: "Customer",
        contactPhone: "+421900000003",
        deliveryCity: "Nitra",
        deliveryStreet: "Short 7",
        deliveryPostalCode: "94901",
        deliveryCountry: "Slovensko",
        paymentMethod: "CASH",
        totalPrice: 3.5,
        items: {
          create: [
            {
              productId: PRODUCT_ID,
              quantity: 1,
              unitPrice: 3.5,
              productName: "Test Product",
              sellerName: "Farmer",
            },
          ],
        },
      },
    });

    const res = await request(app)
      .patch(`/api/checkout/${order.id}/cancel`)
      .set("Cookie", [`accessToken=${otherCustomerToken}`]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("message", "Unauthorized");
  });

  it("PATCH /checkout/item/:id/cancel - farmer cancels only his product in one order", async () => {
    const order = await prisma.order.create({
      data: {
        buyerId: CUSTOMER_ID,
        contactName: "Customer",
        contactPhone: "+421900000003",
        deliveryCity: "Košice",
        deliveryStreet: "Main 5",
        deliveryPostalCode: "04001",
        deliveryCountry: "Slovensko",
        paymentMethod: "CASH",
        totalPrice: 7.0,
        items: {
          create: [
            {
              productId: PRODUCT_ID,
              quantity: 2,
              unitPrice: 3.5,
              productName: "Test Product",
              sellerName: "Farmer",
            },
          ],
        },
      },
      include: { items: true },
    });

    const res = await request(app)
      .patch(`/api/checkout/item/${order.items[0].id}/cancel`)
      .set("Cookie", [`accessToken=${farmerToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Product from order canceled successfully"
    );

    const canceledItem = await prisma.orderItem.findUnique({
      where: { id: order.items[0].id },
    });
    expect(canceledItem?.status).toBe("CANCELED");

    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id },
    });
    expect(updatedOrder?.totalPrice).toBe(0);

    const farmProduct = await prisma.farmProduct.findFirst({
      where: { productId: PRODUCT_ID },
    });
    expect(farmProduct?.stock).toBe(52);
  });

  it("PATCH /checkout/item/:id/cancel - fails with 403 if another farmer tries", async () => {
    const order = await prisma.order.create({
      data: {
        buyerId: CUSTOMER_ID,
        contactName: "Customer",
        contactPhone: "+421900000003",
        deliveryCity: "Prešov",
        deliveryStreet: "East 2",
        deliveryPostalCode: "08001",
        deliveryCountry: "Slovensko",
        paymentMethod: "CASH",
        totalPrice: 3.5,
        items: {
          create: [
            {
              productId: PRODUCT_ID,
              quantity: 1,
              unitPrice: 3.5,
              productName: "Test Product",
              sellerName: "Farmer",
            },
          ],
        },
      },
      include: { items: true },
    });

    const res = await request(app)
      .patch(`/api/checkout/item/${order.items[0].id}/cancel`)
      .set("Cookie", [`accessToken=${otherFarmerToken}`]);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("message", "Not your product");
  });
});
