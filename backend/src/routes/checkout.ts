import { Router } from "express";
import prisma from "../prisma.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";
import { checkoutSchema } from "../schemas/checkoutSchemas.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import { sendEmail } from "../utils/sendEmails.ts";
import Stripe from "stripe";
import {
  buildOrderConfirmationEmail,
  buildPaymentSuccessEmail,
} from "../emailTemplates/orderTemplates.ts";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// POST /checkout
router.post("/", validateRequest(checkoutSchema), async (req, res) => {
  const { cartItems, userInfo } = req.body;

  try {
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

    const paymentLink = `${process.env.FRONTEND_URL}/order/${order.id}/pay`;
    const recipientEmail =
      email ??
      (buyerId
        ? (
            await prisma.user.findUnique({
              where: { id: buyerId },
              select: { email: true },
            })
          )?.email
        : null);

    if (recipientEmail) {
      const { subject, html } = buildOrderConfirmationEmail({
        orderNumber: order.orderNumber,
        totalPrice,
        delivery: {
          deliveryStreet,
          deliveryCity,
          deliveryRegion,
          deliveryPostalCode,
          deliveryCountry,
        },
        items: order.items,
        paymentMethod,
        paymentLink,
      });

      await sendEmail(recipientEmail, subject, html);
    }

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
      where: {
        buyerId: userId,
        orderType: "STANDARD",
      },
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

// Paygate routes

// POST /checkout/create-payment-session
router.post("/create-payment-session", async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    if (!order.totalPrice) {
      return res.status(400).json({ error: "Order has no price" });
    }

    const session = await stripe.checkout.sessions.create({
      client_reference_id: String(orderId),
      payment_method_types: ["card"],
      mode: "payment",

      line_items: order.items.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: item.productName,
          },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      })),

      success_url: `${process.env.FRONTEND_URL}/payment-success?orderId=${orderId}&orderNumber=${order.orderNumber}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled?orderId=${orderId}&orderNumber=${order.orderNumber}`,
    });

    res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create payment session" });
  }
});

// Stripe webhook
router.post("/stripe/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.client_reference_id
      ? Number(session.client_reference_id)
      : undefined;

    if (!orderId) {
      console.error(
        "Missing client_reference_id on checkout.session.completed"
      );
    } else {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          buyer: { select: { email: true } },
        },
      });

      if (!order) {
        console.error(`Order ${orderId} not found in webhook`);
      } else {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: orderId },
            data: { isPaid: true, status: "COMPLETED" },
          }),
          prisma.orderHistory.create({
            data: {
              orderId,
              action: "ORDER_UPDATED",
              message: "Payment confirmed via Stripe",
            },
          }),
        ]);

        const recipient =
          order.anonymousEmail ?? order.buyer?.email ?? null;

        if (recipient) {
          const { subject, html } = buildPaymentSuccessEmail({
            orderNumber: order.orderNumber,
            totalPrice:
              order.totalPrice ??
              order.items.reduce(
                (sum, item) => sum + item.unitPrice * item.quantity,
                0
              ),
            delivery: {
              deliveryStreet: order.deliveryStreet,
              deliveryCity: order.deliveryCity,
              deliveryRegion: order.deliveryRegion,
              deliveryPostalCode: order.deliveryPostalCode,
              deliveryCountry: order.deliveryCountry,
            },
            items: order.items,
            paymentMethod: order.paymentMethod as
              | "CARD"
              | "CASH"
              | "BANK_TRANSFER",
          });

          try {
            await sendEmail(recipient, subject, html);
          } catch (emailErr) {
            console.error("Failed to send payment success email:", emailErr);
          }
        }
      }
    }
  }

  res.json({ received: true });
});

// POST /checkout/payment-link/:id
router.post("/payment-link/:id", async (req, res) => {
  const orderId = Number(req.params.id);

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.isPaid || order.status === "CANCELED")
    return res.status(400).json({ error: "Order already closed" });

  const session = await stripe.checkout.sessions.create({
    client_reference_id: String(orderId),
    payment_method_types: ["card"],
    mode: "payment",
    line_items: order.items.map((item) => ({
      price_data: {
        currency: "eur",
        product_data: { name: item.productName },
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: item.quantity,
    })),

    success_url: `${process.env.FRONTEND_URL}/payment-success?orderId=${orderId}&orderNumber=${order.orderNumber}`,
    cancel_url: `${process.env.FRONTEND_URL}/payment-cancelled?orderId=${orderId}&orderNumber=${order.orderNumber}`,
  });

  res.json({ url: session.url });
});

export default router;
