import { Router } from "express";
import type { Prisma } from "@prisma/client";
import prisma from "../prisma.ts";
import { eventProductSchema } from "../schemas/eventProductSchema.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";

const router = Router();

const checkEventParticipation = async (
  eventId: number,
  userId: number | undefined
) => {
  if (!userId) {
    const err: any = new Error("Unauthorized");
    err.status = 403;
    throw err;
  }

  const participant = await prisma.eventParticipant.findFirst({
    where: { eventId, userId },
  });

  if (!participant) {
    const err: any = new Error("Not authorized for this event");
    err.status = 403;
    throw err;
  }

  return true;
};

//  POST /event-product
router.post(
  "/",
  authenticateToken,
  authorizeRole("FARMER"),
  validateRequest(eventProductSchema),
  async (req, res) => {
    try {
      const { images, eventId, price, stock, ...productData } = req.body;
      const userId = req.user?.id;

      await checkEventParticipation(eventId, userId);

      const product = await prisma.product.create({
        data: {
          ...productData,
          basePrice: price,
          images: images
            ? {
                create: images.map((img: { url: string }) => ({
                  url: img.url,
                })),
              }
            : undefined,
        },
        include: { images: true },
      });

      const eventProduct = await prisma.eventProduct.create({
        data: {
          event: { connect: { id: eventId } },
          product: { connect: { id: product.id } },
          user: { connect: { id: userId! } },
          price,
          stock,
        },
        include: {
          product: { include: { images: true } },
          event: { select: { id: true, title: true } },
        },
      });

      res.status(201).json(eventProduct);
    } catch (error: any) {
      res
        .status(error.status || 400)
        .json({ error: error.message || "Failed to create event product" });
    }
  }
);

// GET /event-product/event/:eventId
router.get(
  "/event/:eventId",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const userId = req.user?.id;
      await checkEventParticipation(eventId, userId);

      const eventProducts = await prisma.eventProduct.findMany({
        where: { eventId, userId },
        include: {
          product: { include: { images: true, reviews: true } },
          user: { select: { id: true, name: true } },
        },
      });

      res.json(eventProducts);
    } catch (error: any) {
      res
        .status(error.status || 400)
        .json({ error: error.message || "Failed to fetch event products" });
    }
  }
);

// /event-product/:id
router.put(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  validateRequest(eventProductSchema.partial()),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { images, name, category, description, price, stock } = req.body;
      const userId = req.user?.id;

      const eventProduct = await prisma.eventProduct.findUnique({
        where: { id },
        include: { product: true, event: true },
      });

      if (!eventProduct)
        return res.status(404).json({ error: "Event product not found" });

      if (eventProduct.userId !== userId) {
        return res
          .status(403)
          .json({ error: "You can only modify your own products" });
      }

      const productUpdateData: Prisma.ProductUpdateInput = {};

      if (name) productUpdateData.name = name;
      if (category) productUpdateData.category = category;
      if (description) productUpdateData.description = description;
      if (typeof price === "number" && !Number.isNaN(price)) {
        productUpdateData.basePrice = price;
      }
      if (images) {
        productUpdateData.images = {
          deleteMany: {},
          create: images.map((img: { url: string }) => ({
            url: img.url,
          })),
        };
      }

      const eventProductUpdateData: Prisma.EventProductUpdateInput = {};
      if (typeof price === "number" && !Number.isNaN(price)) {
        eventProductUpdateData.price = price;
      }
      if (typeof stock === "number" && !Number.isNaN(stock)) {
        eventProductUpdateData.stock = stock;
      }

      if (
        Object.keys(productUpdateData).length === 0 &&
        Object.keys(eventProductUpdateData).length === 0
      ) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const updated = await prisma.eventProduct.update({
        where: { id },
        data: {
          ...eventProductUpdateData,
          ...(Object.keys(productUpdateData).length
            ? { product: { update: productUpdateData } }
            : {}),
        },
        include: {
          product: { include: { images: true } },
          event: { select: { id: true, title: true } },
        },
      });

      res.json(updated);
    } catch (error: any) {
      res
        .status(error.status || 400)
        .json({ error: error.message || "Failed to update event product" });
    }
  }
);

//  DELETE /event-product/:id
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const userId = req.user?.id;

      const eventProduct = await prisma.eventProduct.findUnique({
        where: { id },
        include: { product: true, event: true },
      });

      if (!eventProduct)
        return res.status(404).json({ error: "Event product not found" });

      if (eventProduct.userId !== userId) {
        return res
          .status(403)
          .json({ error: "You can only delete your own products" });
      }

      await prisma.eventProduct.delete({ where: { id } });
      await prisma.product.delete({ where: { id: eventProduct.product.id } });

      res.json({ message: "Event product deleted" });
    } catch (error: any) {
      res
        .status(error.status || 400)
        .json({ error: error.message || "Failed to delete event product" });
    }
  }
);

// DELETE /event-product/event/:eventId ALL PRODUCTS FROM EVENT (userId products)
router.delete(
  "/event/:eventId",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const eventId = Number(req.params.eventId);
      const userId = req.user?.id;

      await checkEventParticipation(eventId, userId);

      const eventProducts = await prisma.eventProduct.findMany({
        where: { eventId, userId },
        include: { product: true },
      });

      for (const ep of eventProducts) {
        await prisma.product.delete({ where: { id: ep.product.id } });
      }

      await prisma.eventProduct.deleteMany({ where: { eventId, userId } });
      res.json({ message: "All your event products deleted" });
    } catch (error: any) {
      res
        .status(error.status || 400)
        .json({ error: error.message || "Failed to delete event products" });
    }
  }
);

export default router;
