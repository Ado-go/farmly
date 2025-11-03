import { Router } from "express";
import prisma from "../prisma.ts";

const router = Router();

// POST /checkout
router.post("/", async (req, res) => {
  const { cartItems, userInfo } = req.body;

  try {
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!userInfo) {
      return res.status(400).json({ message: "Missing user info" });
    }

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

    if (!buyerId && !email) {
      return res
        .status(400)
        .json({ message: "Enter an email to finish order" });
    }

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
        isPaid: false,
        isDelivered: false,
        items: {
          create: cartItems.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            productName: item.productName,
            sellerName: item.sellerName,
          })),
        },
      },
    });

    res.json({
      message: "Order was successfuly created",
      orderId: order.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
