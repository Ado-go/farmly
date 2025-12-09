import { Router } from "express";
import { OrderType, OrderItemStatus } from "@prisma/client";
import prisma from "../prisma.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";

const router = Router();

router.get(
  "/",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const userId = req.user?.id;

      const [farmProducts, eventProducts] = await Promise.all([
        prisma.farmProduct.findMany({
          where: { farm: { farmerId: userId } },
          select: { productId: true },
        }),
        prisma.eventProduct.findMany({
          where: { userId },
          select: { productId: true },
        }),
      ]);

      const productIds = Array.from(
        new Set([
          ...farmProducts.map((p) => p.productId),
          ...eventProducts.map((p) => p.productId),
        ])
      );

      if (productIds.length === 0) {
        return res.json({
          totals: {
            orders: 0,
            preorders: 0,
            totalRevenue: 0,
            standardRevenue: 0,
            preorderRevenue: 0,
            itemsSold: 0,
            avgTicket: 0,
          },
          bestSellers: [],
          ratings: {
            average: null,
            totalReviews: 0,
            topRated: [],
          },
        });
      }

      const orderItems = await prisma.orderItem.findMany({
        where: {
          productId: { in: productIds },
          status: OrderItemStatus.ACTIVE,
        },
        select: {
          productId: true,
          quantity: true,
          unitPrice: true,
          productName: true,
          product: { select: { name: true } },
          order: { select: { id: true, orderType: true, isPaid: true } },
        },
      });

      const orders = {
        [OrderType.STANDARD]: new Set<number>(),
        [OrderType.PREORDER]: new Set<number>(),
      };

      let standardRevenue = 0;
      let preorderRevenue = 0;
      let itemsSold = 0;

      const bestSellerMap = new Map<
        number,
        { name: string; quantity: number; revenue: number }
      >();

      for (const item of orderItems) {
        if (!item.productId) continue;

        const lineTotal = item.unitPrice * item.quantity;
        itemsSold += item.quantity;

        const productName =
          item.product?.name || item.productName || "Unknown product";

        if (item.order.orderType === OrderType.STANDARD) {
          orders[OrderType.STANDARD].add(item.order.id);
          standardRevenue += lineTotal;
        } else if (item.order.orderType === OrderType.PREORDER) {
          orders[OrderType.PREORDER].add(item.order.id);
          preorderRevenue += lineTotal;
        }

        const current = bestSellerMap.get(item.productId) || {
          name: productName,
          quantity: 0,
          revenue: 0,
        };

        bestSellerMap.set(item.productId, {
          name: current.name,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + lineTotal,
        });
      }

      const bestSellers = Array.from(bestSellerMap.entries())
        .map(([productId, data]) => ({
          productId,
          ...data,
        }))
        .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
        .slice(0, 5);

      const ratingGroups = await prisma.review.groupBy({
        by: ["productId"],
        where: { productId: { in: productIds } },
        _avg: { rating: true },
        _count: { rating: true },
      });

      const productNames = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      });
      const nameMap = new Map(productNames.map((p) => [p.id, p.name]));

      const totalReviews = ratingGroups.reduce(
        (sum, r) => sum + r._count.rating,
        0
      );

      const sumRatings = ratingGroups.reduce(
        (sum, r) => sum + (r._avg.rating || 0) * r._count.rating,
        0
      );

      const averageRating = totalReviews > 0 ? sumRatings / totalReviews : null;

      const topRated = ratingGroups
        .map((r) => ({
          productId: r.productId,
          name: nameMap.get(r.productId) || "Unknown product",
          averageRating: r._avg.rating,
          reviewCount: r._count.rating,
        }))
        .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
        .slice(0, 5);

      const totalOrders =
        orders[OrderType.STANDARD].size + orders[OrderType.PREORDER].size;
      const totalRevenue = standardRevenue + preorderRevenue;

      const avgTicket =
        totalOrders > 0 ? Number(totalRevenue / totalOrders) : 0;

      res.json({
        totals: {
          orders: orders[OrderType.STANDARD].size,
          preorders: orders[OrderType.PREORDER].size,
          totalRevenue,
          standardRevenue,
          preorderRevenue,
          itemsSold,
          avgTicket,
        },
        bestSellers,
        ratings: {
          average: averageRating,
          totalReviews,
          topRated,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Unable to load farmer statistics" });
    }
  }
);

export default router;
