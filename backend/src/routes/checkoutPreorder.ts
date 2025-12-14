import { Router } from "express";
import prisma from "../prisma.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import { preorderSchema } from "../schemas/preorderSchemas.ts";
import { sendEmail } from "../utils/sendEmails.ts";
import { buildPreorderCreatedEmail } from "../emailTemplates/preorderCreatedTemplate.ts";
import { buildOrderCancellationEmail } from "../emailTemplates/orderCancellationTemplate.ts";
import { buildOrderItemCancellationEmail } from "../emailTemplates/orderItemCancellationTemplate.ts";
import { buildFarmerOrderNotificationEmail } from "../emailTemplates/farmerOrderNotificationTemplate.ts";
import { buildFarmerOrderCancellationEmail } from "../emailTemplates/farmerOrderCancellationTemplate.ts";

const router = Router();

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

const buildPickupInfo = (
  street?: string | null,
  postalCode?: string | null,
  city?: string | null,
  country?: string | null
) => {
  const parts = [
    street,
    [postalCode, city].filter(Boolean).join(" "),
    country,
  ].filter(Boolean);
  return parts.join(" • ");
};

const fetchEventProductsWithUsers = async (
  productIds: number[],
  eventId: number
) => {
  if (!productIds.length) return [];

  return prisma.eventProduct.findMany({
    where: { eventId, productId: { in: productIds } },
    include: {
      user: { select: { id: true, email: true, name: true, phone: true } },
    },
  });
};

const groupPreorderItemsByFarmer = (
  orderItems: {
    productId: number | null;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[],
  eventProducts: Awaited<ReturnType<typeof fetchEventProductsWithUsers>>
): FarmerGroup[] => {
  const byProduct = new Map(
    eventProducts.map((ep) => [ep.productId, ep])
  );

  const groups = new Map<number, FarmerGroup>();

  for (const item of orderItems) {
    const ep = item.productId ? byProduct.get(item.productId) : undefined;
    const farmer = ep?.user;
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

// POST /checkout-preorder
router.post("/", validateRequest(preorderSchema), async (req, res) => {
  const { cartItems, userInfo, eventId } = req.body;

  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) return res.status(404).json({ message: "Event not found" });

    const cartProductIds = cartItems
      .map((item: any) => item.productId)
      .filter((id: any): id is number => typeof id === "number");

    const [eventProductsForCart, participantEntries] = await Promise.all([
      prisma.eventProduct.findMany({
        where: { eventId, productId: { in: cartProductIds } },
        include: {
          user: { select: { id: true, email: true, name: true, phone: true } },
        },
      }),
      prisma.eventParticipant.findMany({
        where: { eventId },
        select: { userId: true, stallName: true },
      }),
    ]);

    const eventProductMap = new Map(
      eventProductsForCart.map((ep) => [ep.productId, ep])
    );
    const stallMap = new Map(
      participantEntries.map((p) => {
        const normalized =
          typeof p.stallName === "string" ? p.stallName.trim() || null : null;
        return [p.userId, normalized];
      })
    );

    const hasMissingProduct = cartProductIds.some(
      (id: number) => !eventProductMap.has(id)
    );

    if (hasMissingProduct) {
      return res
        .status(400)
        .json({ message: "Some products are not available for this event" });
    }

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
          create: cartItems.map((item: any) => {
            const eventProduct = item.productId
              ? eventProductMap.get(item.productId)
              : undefined;
            const sellerName = eventProduct?.user?.name ?? item.sellerName;
            const stallName = eventProduct
              ? stallMap.get(eventProduct.userId) ?? null
              : null;

            return {
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              productName: item.productName,
              sellerName,
              stallName,
              status: "ACTIVE",
            };
          }),
        },
      },
      include: {
        items: true,
        buyer: { select: { email: true, name: true, phone: true } },
        event: true,
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

    const recipientEmail =
      order.anonymousEmail ?? order.buyer?.email ?? null;
    const templateItems = order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    if (recipientEmail) {
      try {
        const { subject, html } = buildPreorderCreatedEmail({
          orderNumber: order.orderNumber,
          eventTitle: event.title,
          pickupInfo: buildPickupInfo(
            event.street,
            event.postalCode,
            event.city,
            event.country
          ),
          items: templateItems,
          totalPrice,
        });
        await sendEmail(recipientEmail, subject, html);
      } catch (emailErr) {
        console.error("Failed to send preorder confirmation email:", emailErr);
      }
    }

    const eventProducts = await fetchEventProductsWithUsers(
      order.items
        .map((i) => i.productId)
        .filter((id): id is number => typeof id === "number"),
      eventId
    );
    const farmerGroups = groupPreorderItemsByFarmer(order.items, eventProducts);
    const pickupInfo = buildPickupInfo(
      event.street,
      event.postalCode,
      event.city,
      event.country
    );

    await Promise.all(
      farmerGroups.map(async (group) => {
        const { subject, html } = buildFarmerOrderNotificationEmail({
          orderNumber: order.orderNumber,
          isPreorder: true,
          eventTitle: event.title ?? undefined,
          customerName: order.contactName,
          customerEmail: recipientEmail ?? undefined,
          customerPhone: order.contactPhone ?? undefined,
          items: group.items,
          totalPrice: group.totalPrice,
          pickupInfo,
          paymentMethod: "CASH",
        });

        try {
          await sendEmail(group.farmerEmail, subject, html);
        } catch (emailErr) {
          console.error(
            "Failed to notify farmer about preorder:",
            emailErr
          );
        }
      })
    );

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
      include: {
        items: true,
        event: true,
        buyer: { select: { email: true, name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(
      orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        orderType: order.orderType,
        createdAt: order.createdAt,
        isPaid: order.isPaid,
        totalPrice: order.totalPrice ?? 0,
        paymentMethod: order.paymentMethod,
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
        event: order.event
          ? {
              title: order.event.title,
              startDate: order.event.startDate,
              endDate: order.event.endDate,
              city: order.event.city,
              street: order.event.street,
              postalCode: order.event.postalCode,
              country: order.event.country,
            }
          : null,
        items: order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          sellerName: item.sellerName,
          stallName: item.stallName,
          status: item.status,
        })),
      }))
    );
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
        include: {
          items: true,
          event: true,
          buyer: { select: { email: true, name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return res.json(
        orders.map((order) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          orderType: order.orderType,
          createdAt: order.createdAt,
          isPaid: order.isPaid,
          totalPrice: order.totalPrice ?? 0,
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
          event: order.event
            ? {
                title: order.event.title,
                startDate: order.event.startDate,
                endDate: order.event.endDate,
                city: order.event.city,
                street: order.event.street,
                postalCode: order.event.postalCode,
                country: order.event.country,
              }
            : null,
          items: order.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            sellerName: item.sellerName,
            stallName: item.stallName,
            status: item.status,
          })),
        }))
      );
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
      include: {
        items: true,
        buyer: { select: { email: true, name: true, phone: true } },
        event: true,
      },
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.buyerId !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    if (order.orderType !== "PREORDER")
      return res
        .status(400)
        .json({ message: "This order cannot be canceled" });

    const eventEndDate = order.event?.endDate;

    if (!eventEndDate)
      return res
        .status(400)
        .json({ message: "Event for this preorder was not found" });

    if (eventEndDate.getTime() <= Date.now()) {
      return res
        .status(400)
        .json({
          message: "Preorders cannot be canceled after the event has ended",
        });
    }

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

    const recipientEmail =
      order.anonymousEmail ?? order.buyer?.email ?? null;

    if (recipientEmail) {
      try {
        const { subject, html } = buildOrderCancellationEmail({
          orderNumber: order.orderNumber,
          isPreorder: true,
          reason: "You canceled the preorder.",
        });
        await sendEmail(recipientEmail, subject, html);
      } catch (emailErr) {
        console.error("Failed to send preorder cancellation email:", emailErr);
      }
    }

    const eventProducts = await fetchEventProductsWithUsers(
      order.items
        .map((i) => i.productId)
        .filter((id): id is number => typeof id === "number"),
      order.eventId!
    );
    const farmerGroups = groupPreorderItemsByFarmer(order.items, eventProducts);

    await Promise.all(
      farmerGroups.map(async (group) => {
        const { subject, html } = buildFarmerOrderCancellationEmail({
          orderNumber: order.orderNumber,
          isPreorder: true,
          eventTitle: order.event?.title ?? undefined,
          items: group.items,
          totalPrice: group.totalPrice,
          reason: "Customer canceled the preorder.",
        });

        try {
          await sendEmail(group.farmerEmail, subject, html);
        } catch (emailErr) {
          console.error(
            "Failed to notify farmer about preorder cancellation:",
            emailErr
          );
        }
      })
    );

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
          order: {
            include: {
              buyer: { select: { email: true, name: true } },
              event: true,
            },
          },
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

      if (item.order.orderType !== "PREORDER")
        return res
          .status(400)
          .json({ message: "This item cannot be canceled" });

      const eventEndDate = item.order.event?.endDate;

      if (!eventEndDate)
        return res
          .status(400)
          .json({ message: "Event for this preorder was not found" });

      if (eventEndDate.getTime() <= Date.now())
        return res.status(400).json({
          message: "Farmer cannot cancel items after the event has ended",
        });

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

      res.json({
        message: "Preorder item canceled",
        newTotalPrice: newTotal,
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
            isPreorder: true,
            reason: "Farmer canceled the preorder item.",
            remainingTotal: newTotal,
          });

          await sendEmail(recipientEmail, subject, html);
        } catch (emailErr) {
          console.error(
            "Failed to send preorder item cancellation email:",
            emailErr
          );
        }
      }
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal error" });
    }
  }
);

export default router;
