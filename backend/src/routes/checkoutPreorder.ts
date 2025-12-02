import { Router } from "express";
import prisma from "../prisma.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import { preorderSchema } from "../schemas/preorderSchemas.ts";

const router = Router();

// POST /checkout-preorder
router.post("/", validateRequest(preorderSchema), async (req, res) => {
  const { cartItems, userInfo, eventId } = req.body;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) return res.status(404).json({ message: "Event not found" });

    const totalPrice = cartItems.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        eventId,
        orderType: "PREORDER",
        buyerId: userInfo.buyerId || null,
        anonymousEmail: userInfo.email,
        contactName: userInfo.contactName,
        contactPhone: userInfo.contactPhone,
        paymentMethod: "CASH",
        deliveryCity: event.city,
        deliveryStreet: event.street,
        deliveryPostalCode: event.postalCode,
        deliveryCountry: event.country,
        totalPrice,
        isPaid: false,
        isDelivered: false,
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
    });

    await prisma.orderHistory.create({
      data: {
        orderId: order.id,
        userId: userInfo.buyerId ?? null,
        action: "ORDER_CREATED",
        message: `Preorder #${order.orderNumber.slice(0, 8)} created.`,
      },
    });

    return res.json({
      message: "Preorder created",
      orderId: order.id,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /my-orders
router.get("/my-orders", authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  try {
    const orders = await prisma.order.findMany({
      where: {
        buyerId: userId,
        orderType: "PREORDER",
      },
      include: { items: true, event: true },
      orderBy: { createdAt: "desc" },
    });

    return res.json(orders);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Cannot fetch preorder orders" });
  }
});

// GET /farmer-orders
router.get(
  "/farmer-orders",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    const userId = req.user?.id;

    try {
      const farmerProducts = await prisma.product.findMany({
        where: { eventLinks: { some: { userId } } },
      });

      const productIds = farmerProducts.map((p) => p.id);

      const orders = await prisma.order.findMany({
        where: {
          orderType: "PREORDER",
          items: {
            some: { productId: { in: productIds } },
          },
        },
        include: { items: true, event: true },
        orderBy: { createdAt: "desc" },
      });

      return res.json(orders);
    } catch (err) {
      console.error(err);
      return res
        .status(500)
        .json({ message: "Cannot fetch farmer preorder orders" });
    }
  }
);

// PATCH /checkout-preorder/:id/cancel (Customer)
router.patch("/:id/cancel", authenticateToken, async (req, res) => {
  const orderId = parseInt(req.params.id);
  const userId = req.user?.id;

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
          items: {
            updateMany: { where: {}, data: { status: "CANCELED" } },
          },
        },
      }),
      prisma.orderHistory.create({
        data: {
          orderId,
          userId,
          action: "ORDER_CANCELED",
          message: "Customer canceled entire preorder",
        },
      }),
    ]);

    return res.json({ message: "Preorder canceled" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal error" });
  }
});

// PATCH /checkout-preorder/item/:id/cancel (FARMER)
router.patch(
  "/item/:id/cancel",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    const itemId = parseInt(req.params.id);
    const userId = req.user?.id;

    try {
      const item = await prisma.orderItem.findUnique({
        where: { id: itemId },
        include: {
          order: true,
          product: { include: { eventLinks: true } },
        },
      });

      if (!item) return res.status(404).json({ message: "Item not found" });

      if (!item.product)
        return res
          .status(404)
          .json({ message: "Product not found for this item" });

      const ownsProduct = item.product.eventLinks.some(
        (p) => p.userId === userId
      );

      if (!ownsProduct)
        return res.status(403).json({ message: "Unauthorized" });

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
          message: `Farmer canceled preorder item "${item.productName}"`,
        },
      });

      return res.json({
        message: "Preorder item canceled",
        newTotalPrice: newTotal,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal error" });
    }
  }
);

export default router;
