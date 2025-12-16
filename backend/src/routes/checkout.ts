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
import { buildOrderCancellationEmail } from "../emailTemplates/orderCancellationTemplate.ts";
import { buildOrderItemCancellationEmail } from "../emailTemplates/orderItemCancellationTemplate.ts";
import { buildFarmerOrderNotificationEmail } from "../emailTemplates/farmerOrderNotificationTemplate.ts";
import { buildFarmerOrderCancellationEmail } from "../emailTemplates/farmerOrderCancellationTemplate.ts";
import { buildProductSoldOutEmail } from "../emailTemplates/productSoldOutTemplate.ts";

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type FarmerGroupItem = {
  name: string;
  quantity: number;
  unitPrice?: number;
};

type FarmerGroup = {
  farmerId: number;
  farmerEmail: string;
  farmerName?: string | null;
  items: FarmerGroupItem[];
  totalPrice: number;
};

type SoldOutProductNotice = {
  productId: number;
  productName: string;
  farmerEmail?: string | null;
  farmerName?: string | null;
};

const buildDeliveryInfo = (
  deliveryStreet: string,
  deliveryPostalCode: string,
  deliveryCity: string,
  deliveryCountry: string
) => {
  const line1 = [deliveryStreet, deliveryCity].filter(Boolean).join(", ");
  const line2 = [deliveryPostalCode, deliveryCity].filter(Boolean).join(" ");
  const parts = [line1 || null, line2 || null, deliveryCountry || null].filter(
    Boolean
  );
  return parts.join(" • ");
};

const fetchFarmProductsWithFarm = async (productIds: number[]) => {
  if (!productIds.length) return [];

  return prisma.farmProduct.findMany({
    where: { productId: { in: productIds } },
    include: {
      product: { select: { id: true, name: true } },
      farm: {
        select: {
          id: true,
          name: true,
          city: true,
          street: true,
          postalCode: true,
          country: true,
          farmer: { select: { id: true, email: true, name: true, phone: true } },
        },
      },
    },
  });
};

const groupItemsByFarmer = (
  orderItems: {
    productId: number | null;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[],
  farmProducts: Awaited<ReturnType<typeof fetchFarmProductsWithFarm>>
): FarmerGroup[] => {
  const byProductId = new Map(
    farmProducts.map((fp) => [fp.productId, fp])
  );

  const groups = new Map<number, FarmerGroup>();

  for (const item of orderItems) {
    const fp = item.productId ? byProductId.get(item.productId) : undefined;
    const farmer = fp?.farm?.farmer;
    if (!farmer?.email || !farmer.id) continue;

    const existing = groups.get(farmer.id) ?? {
      farmerId: farmer.id,
      farmerEmail: farmer.email,
      farmerName: farmer.name,
      items: [],
      totalPrice: 0,
    };

    existing.items.push({
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    });
    existing.totalPrice += item.unitPrice * item.quantity;

    groups.set(farmer.id, existing);
  }

  return Array.from(groups.values());
};

// POST /checkout
router.post("/", validateRequest(checkoutSchema), async (req, res) => {
  const { cartItems, userInfo } = req.body;

  try {
    const {
      buyerId,
      email,
      contactName,
      contactPhone,
      deliveryCity,
      deliveryStreet,
      deliveryPostalCode,
      deliveryCountry,
      paymentMethod,
    } = userInfo;

    const totalPrice = cartItems.reduce(
      (sum: number, item: any) => sum + item.unitPrice * item.quantity,
      0
    );

    const productIds = cartItems.map((item: any) => item.productId);
    const farmProducts = await fetchFarmProductsWithFarm(productIds);
    const farmerIdByProduct = new Map(
      farmProducts.map((fp) => [fp.productId, fp.farm?.farmer?.id ?? null])
    );

    const availabilityByProduct = new Map(
      farmProducts.map((fp) => [fp.productId, fp.isAvailable])
    );
    const stockByProduct = new Map(
      farmProducts.map((fp) => [fp.productId, fp.stock ?? 0])
    );

    const unavailableProducts = cartItems
      .filter((item: any) => {
        const availability = availabilityByProduct.get(item.productId);
        return availability === false || availability === undefined;
      })
      .map((item: any) => item.productId);

    if (unavailableProducts.length > 0) {
      return res.status(400).json({
        message: "Some products are unavailable",
        unavailableProducts,
      });
    }

    const insufficientStock = cartItems
      .map((item: any) => {
        const available = stockByProduct.get(item.productId);
        return { ...item, available };
      })
      .filter(
        (item: any) =>
          typeof item.available !== "number" || item.available < item.quantity
      )
      .map((item: any) => ({
        productId: item.productId,
        requested: item.quantity,
        available: item.available ?? 0,
      }));

    if (insufficientStock.length > 0) {
      return res.status(400).json({
        message: "Insufficient stock for some products",
        insufficientStock,
      });
    }

    const { order, soldOutProducts } = await prisma.$transaction(
      async (tx) => {
        const soldOutNotices: SoldOutProductNotice[] = [];

        for (const item of cartItems) {
          if (!item.productId) continue;

          const updateResult = await tx.farmProduct.updateMany({
            where: {
              productId: item.productId,
              stock: { gte: item.quantity },
            },
            data: { stock: { decrement: item.quantity } },
          });

          if (updateResult.count === 0) {
            const err: any = new Error("INSUFFICIENT_STOCK");
            err.code = "INSUFFICIENT_STOCK";
            err.productId = item.productId;
            throw err;
          }

          const updatedProduct = await tx.farmProduct.findFirst({
            where: { productId: item.productId },
            include: {
              product: { select: { name: true } },
              farm: {
                select: {
                  farmer: { select: { email: true, name: true } },
                },
              },
            },
          });

          if (updatedProduct && updatedProduct.stock === 0) {
            soldOutNotices.push({
              productId: item.productId,
              productName:
                updatedProduct.product?.name ?? item.productName ?? "Produkt",
              farmerEmail: updatedProduct.farm?.farmer?.email,
              farmerName: updatedProduct.farm?.farmer?.name,
            });
          }
        }

        const createdOrder = await tx.order.create({
          data: {
            buyerId: buyerId || null,
            anonymousEmail: buyerId ? null : email,
            orderType: "STANDARD",
            contactName,
            contactPhone,

            deliveryCity,
            deliveryStreet,
            deliveryPostalCode,
            deliveryCountry,

            paymentMethod,
            totalPrice,
            status: "PENDING",

            items: {
              create: cartItems.map((item: any) => ({
                productId: item.productId,
                farmerId: item.productId
                  ? farmerIdByProduct.get(item.productId) ?? null
                  : null,
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

        await tx.orderHistory.create({
          data: {
            orderId: createdOrder.id,
            userId: buyerId || null,
            action: "ORDER_CREATED",
            message: `Order #${createdOrder.orderNumber.slice(0, 8)} was created`,
          },
        });

        return { order: createdOrder, soldOutProducts: soldOutNotices };
      }
    );

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
      try {
        const { subject, html } = buildOrderConfirmationEmail({
          orderNumber: order.orderNumber,
          totalPrice,
          delivery: {
            deliveryStreet,
            deliveryCity,
            deliveryPostalCode,
            deliveryCountry,
          },
          items: order.items,
          paymentMethod,
          paymentLink,
        });

        await sendEmail(recipientEmail, subject, html);
      } catch (emailErr) {
        console.error("Failed to send order confirmation email:", emailErr);
      }
    }

    const farmerGroups = groupItemsByFarmer(order.items, farmProducts);
    const deliveryInfo = buildDeliveryInfo(
      deliveryStreet,
      deliveryPostalCode,
      deliveryCity,
      deliveryCountry
    );

    await Promise.all(
      farmerGroups.map(async (group) => {
        const { subject, html } = buildFarmerOrderNotificationEmail({
          orderNumber: order.orderNumber,
          isPreorder: false,
          customerName: contactName,
          customerEmail: recipientEmail ?? undefined,
          customerPhone: contactPhone ?? undefined,
          items: group.items,
          totalPrice: group.totalPrice,
          deliveryInfo,
          paymentMethod,
        });

        try {
          await sendEmail(group.farmerEmail, subject, html);
        } catch (emailErr) {
          console.error("Failed to notify farmer about order:", emailErr);
        }
      })
    );

    if (soldOutProducts.length > 0) {
      for (const product of soldOutProducts) {
        if (!product.farmerEmail) continue;
        try {
          const { subject, html } = buildProductSoldOutEmail({
            productName: product.productName,
            farmerName: product.farmerName ?? undefined,
            isPreorder: false,
          });
          await sendEmail(product.farmerEmail, subject, html);
        } catch (emailErr) {
          console.error("Failed to send sold-out notification:", emailErr);
        }
      }
    }

    res.json({
      message: "Order was successfully created",
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (err) {
    if ((err as any)?.code === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        message: "Insufficient stock for some products",
      });
    }

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
      include: {
        items: true,
        buyer: { select: { email: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        orderType: order.orderType,
        createdAt: order.createdAt,
        isPaid: order.isPaid,
        delivery: {
          city: order.deliveryCity,
          street: order.deliveryStreet,
          postalCode: order.deliveryPostalCode,
          country: order.deliveryCountry,
        },
        contact: {
          name: order.contactName,
          phone: order.contactPhone,
          email: order.anonymousEmail ?? order.buyer?.email ?? null,
        },
        paymentMethod: order.paymentMethod,
        totalPrice: order.totalPrice ?? 0,
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
      const orders = await prisma.order.findMany({
        where: {
          orderType: "STANDARD",
          items: { some: { farmerId: userId } },
        },
        include: {
          items: {
            where: { farmerId: userId },
          },
          buyer: { select: { id: true, email: true, name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(
        orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          orderType: order.orderType,
          createdAt: order.createdAt,
          isPaid: order.isPaid,
          paymentMethod: order.paymentMethod,
          buyer: {
            id: order.buyerId,
            email: order.anonymousEmail ?? order.buyer?.email ?? null,
            name: order.buyer?.name ?? null,
            phone: order.buyer?.phone ?? null,
          },
          contact: {
            name: order.contactName,
            phone: order.contactPhone,
            email: order.anonymousEmail ?? order.buyer?.email ?? null,
          },
          delivery: {
            city: order.deliveryCity,
            street: order.deliveryStreet,
            postalCode: order.deliveryPostalCode,
            country: order.deliveryCountry,
          },
          totalPrice: order.totalPrice ?? 0,
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
      include: {
        items: true,
        buyer: { select: { email: true, name: true, phone: true } },
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.buyerId !== userId)
      return res.status(403).json({ message: "Unauthorized" });
    if (order.status === "CANCELED") {
      return res.status(400).json({ message: "Order already canceled" });
    }

    const itemsToRestock = order.items
      .filter((i) => i.status === "ACTIVE" && i.productId !== null)
      .reduce<Map<number, number>>((map, item) => {
        const current = map.get(item.productId!) ?? 0;
        map.set(item.productId!, current + item.quantity);
        return map;
      }, new Map());

    await prisma.$transaction([
      ...Array.from(itemsToRestock.entries()).map(([productId, quantity]) =>
        prisma.farmProduct.updateMany({
          where: { productId },
          data: { stock: { increment: quantity } },
        })
      ),
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

    const recipientEmail =
      order.anonymousEmail ?? order.buyer?.email ?? null;

    if (recipientEmail) {
      try {
        const { subject, html } = buildOrderCancellationEmail({
          orderNumber: order.orderNumber,
          isPreorder: false,
          reason: "Objednávku si zrušil.",
        });
        await sendEmail(recipientEmail, subject, html);
      } catch (emailErr) {
        console.error("Failed to send order cancellation email:", emailErr);
      }
    }

    const farmProducts = await fetchFarmProductsWithFarm(
      order.items
        .map((i) => i.productId)
        .filter((id): id is number => typeof id === "number")
    );
    const farmerGroups = groupItemsByFarmer(order.items, farmProducts);

    await Promise.all(
      farmerGroups.map(async (group) => {
        const { subject, html } = buildFarmerOrderCancellationEmail({
          orderNumber: order.orderNumber,
          isPreorder: false,
          items: group.items,
          totalPrice: group.totalPrice,
          reason: "Zákazník zrušil objednávku.",
        });

        try {
          await sendEmail(group.farmerEmail, subject, html);
        } catch (emailErr) {
          console.error("Failed to notify farmer about cancellation:", emailErr);
        }
      })
    );

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
          order: {
            include: { buyer: { select: { email: true, name: true } } },
          },
          product: { include: { farmLinks: { include: { farm: true } } } },
        },
      });

      if (!item)
        return res.status(404).json({ message: "Order item not found" });

      const isFarmerOwner =
        item.farmerId === userId ||
        item.product?.farmLinks.some((fp) => fp.farm.farmerId === userId);
      if (!isFarmerOwner)
        return res.status(403).json({ message: "Not your product" });
      if (item.status === "CANCELED") {
        return res.status(400).json({ message: "Item already canceled" });
      }

      const { calculatedTotal, orderCanceled } = await prisma.$transaction(
        async (tx) => {
          if (item.productId) {
            await tx.farmProduct.updateMany({
              where: { productId: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }

          await tx.orderItem.update({
            where: { id: itemId },
            data: { status: "CANCELED" },
          });

          const activeItems = await tx.orderItem.findMany({
            where: { orderId: item.orderId, status: "ACTIVE" },
          });

          const calculatedTotal = activeItems.reduce(
            (sum, i) => sum + i.unitPrice * i.quantity,
            0
          );

          await tx.order.update({
            where: { id: item.orderId },
            data: {
              totalPrice: calculatedTotal,
              ...(activeItems.length === 0 ? { status: "CANCELED" } : {}),
            },
          });

          await tx.orderHistory.create({
            data: {
              orderId: item.orderId,
              userId,
              action: "ITEM_CANCELED",
              message: `Farmer canceled item "${item.productName}"`,
            },
          });

          if (activeItems.length === 0) {
            await tx.orderHistory.create({
              data: {
                orderId: item.orderId,
                userId,
                action: "ORDER_CANCELED",
                message:
                  "All items were canceled by farmers, order was canceled.",
              },
            });
          }

          return {
            calculatedTotal,
            orderCanceled: activeItems.length === 0,
          };
        }
      );

      res.json({
        message: "Product from order canceled successfully",
        newTotalPrice: calculatedTotal,
        orderCanceled,
      });

      const recipientEmail =
        item.order.anonymousEmail ?? item.order.buyer?.email ?? null;
      if (recipientEmail) {
        try {
          const { subject, html } = buildOrderItemCancellationEmail({
            orderNumber: item.order.orderNumber,
            itemName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            isPreorder: false,
            reason: "Položku zrušil farmár.",
            remainingTotal: calculatedTotal,
          });

          await sendEmail(recipientEmail, subject, html);
        } catch (emailErr) {
          console.error(
            "Failed to send order item cancellation email:",
            emailErr
          );
        }

        if (orderCanceled) {
          try {
            const { subject, html } = buildOrderCancellationEmail({
              orderNumber: item.order.orderNumber,
              isPreorder: false,
              reason:
                "Všetky položky z tvojej objednávky farmári zrušili, preto sme zrušili celú objednávku.",
            });

            await sendEmail(recipientEmail, subject, html);
          } catch (emailErr) {
            console.error(
              "Failed to send order cancellation email after all items canceled:",
              emailErr
            );
          }
        }
      }
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
            data: { isPaid: true },
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
              deliveryPostalCode: order.deliveryPostalCode,
              deliveryCountry: order.deliveryCountry,
            },
            items: order.items,
            paymentMethod: order.paymentMethod as "CARD" | "CASH",
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
