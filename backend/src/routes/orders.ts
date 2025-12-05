import { Router } from "express";
import prisma from "../prisma.ts";

const router = Router();

// Public lookup: GET /api/orders/:orderNumber
router.get("/:orderNumber", async (req, res) => {
  const { orderNumber } = req.params;

  try {
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        buyer: { select: { email: true, name: true, phone: true } },
        event: true,
      },
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      orderType: order.orderType,
      createdAt: order.createdAt,
      isPaid: order.isPaid,
      paymentMethod: order.paymentMethod,
      totalPrice: order.totalPrice ?? 0,
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
            city: order.event.city,
            street: order.event.street,
            postalCode: order.event.postalCode,
            country: order.event.country,
          }
        : null,
      items: order.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        sellerName: i.sellerName,
        status: i.status,
      })),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Cannot fetch order" });
  }
});

export default router;
