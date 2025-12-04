import { Router } from "express";
import { OrderType, Role } from "@prisma/client";
import prisma from "../prisma.ts";

const router = Router();

// GET /public-stats
router.get("/", async (_req, res) => {
  try {
    const [farmers, orders, preorders] = await Promise.all([
      prisma.user.count({ where: { role: Role.FARMER } }),
      prisma.order.count({ where: { orderType: OrderType.STANDARD } }),
      prisma.order.count({ where: { orderType: OrderType.PREORDER } }),
    ]);

    res.json({ farmers, orders, preorders });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch public statistics." });
  }
});

export default router;
