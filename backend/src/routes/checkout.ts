import { Router } from "express";
import prisma from "../prisma.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";

const router = Router();

// POST /checkout
router.post("/", async (req, res) => {
  const { cartItems, userInfo } = req.body;

  try {
    if (!cartItems || cartItems.length === 0)
      return res.status(400).json({ message: "Cart is empty" });

    if (!userInfo)
      return res.status(400).json({ message: "Missing user info" });

    const {
      buyerId,
      email,
      deliveryCity,
      deliveryStreet,
      deliveryRegion,
      deliveryPostalCode,
      deliveryCountry,
      paymentMethod,
    } = userInfo;

    if (!buyerId && !email)
      return res
        .status(400)
        .json({ message: "Enter an email to finish order" });

    const totalPrice = cartItems.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        buyerId: buyerId || null,
        anonymousEmail: buyerId ? null : email,
        orderType: "STANDARD",
        deliveryCity,
        deliveryStreet,
        deliveryRegion,
        deliveryPostalCode,
        deliveryCountry,
        paymentMethod,
        totalPrice,
        status: "PENDING",
        items: {
          create: cartItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            productName: item.productName,
            sellerName: item.sellerName,
            status: "ACTIVE",
          })),
        },
      },
      include: { items: true },
    });

    await prisma.orderHistory.create({
      data: {
        orderId: order.id,
        userId: buyerId || null,
        action: "ORDER_CREATED",
        message: `Order #${order.orderNumber.slice(0, 8)} was created`,
      },
    });

    res.json({
      message: "Order was successfully created",
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// GET /checkout/my-orders
router.get("/my-orders", authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: userId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        delivery: {
          city: order.deliveryCity,
          street: order.deliveryStreet,
          region: order.deliveryRegion,
          postalCode: order.deliveryPostalCode,
          country: order.deliveryCountry,
        },
        paymentMethod: order.paymentMethod,
        totalPrice: order.totalPrice,
        items: order.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          sellerName: i.sellerName,
          status: i.status,
        })),
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cannot fetch user orders" });
  }
});

// GET /checkout/farmer-orders
router.get(
  "/farmer-orders",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    const userId = req.user?.id;

    try {
      const farms = await prisma.farm.findMany({
        where: { farmerId: userId },
        include: { farmProducts: true },
      });

      const productIds = farms.flatMap((f) =>
        f.farmProducts.map((p) => p.productId)
      );

      if (productIds.length === 0)
        return res.json({ message: "No products found for this farmer." });

      const orders = await prisma.order.findMany({
        where: {
          items: {
            some: { productId: { in: productIds } },
          },
        },
        include: {
          items: {
            where: { productId: { in: productIds } },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(
        orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt,
          buyer: {
            id: order.buyerId,
            email: order.anonymousEmail ?? null,
          },
          items: order.items.map((i) => ({
            id: i.id,
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            status: i.status,
          })),
        }))
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Cannot fetch farmer orders" });
    }
  }
);

// PATCH /checkout/:id/cancel
router.patch("/:id/cancel", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const orderId = parseInt(req.params.id);

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.buyerId !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELED",
          items: { updateMany: { where: {}, data: { status: "CANCELED" } } },
        },
      }),
      prisma.orderHistory.create({
        data: {
          orderId,
          userId,
          action: "ORDER_CANCELED",
          message: `Customer canceled the entire order`,
        },
      }),
    ]);

    res.json({ message: "Order canceled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to cancel order" });
  }
});

// PATCH /checkout/item/:id/cancel
router.patch(
  "/item/:id/cancel",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    const userId = req.user?.id;
    const itemId = parseInt(req.params.id);

    try {
      const item = await prisma.orderItem.findUnique({
        where: { id: itemId },
        include: {
          order: true,
          product: { include: { farmLinks: { include: { farm: true } } } },
        },
      });

      if (!item)
        return res.status(404).json({ message: "Order item not found" });

      const isFarmerOwner = item.product?.farmLinks.some(
        (fp) => fp.farm.farmerId === userId
      );
      if (!isFarmerOwner)
        return res.status(403).json({ message: "Not your product" });

      await prisma.orderItem.update({
        where: { id: itemId },
        data: { status: "CANCELED" },
      });

      const activeItems = await prisma.orderItem.findMany({
        where: { orderId: item.orderId, status: "ACTIVE" },
      });

      const newTotal = activeItems.reduce(
        (sum, i) => sum + i.unitPrice * i.quantity,
        0
      );

      await prisma.order.update({
        where: { id: item.orderId },
        data: { totalPrice: newTotal },
      });

      await prisma.orderHistory.create({
        data: {
          orderId: item.orderId,
          userId,
          action: "ITEM_CANCELED",
          message: `Farmer canceled item "${item.productName}"`,
        },
      });

      res.json({
        message: "Product from order canceled successfully",
        newTotalPrice: newTotal,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to cancel product in order" });
    }
  }
);

export default router;
