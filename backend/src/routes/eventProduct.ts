import { Router } from "express";
import type { Prisma } from "@prisma/client";
import prisma from "../prisma.ts";
import { eventProductSchema } from "../schemas/eventProductSchema.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";
import { v2 as cloudinary } from "cloudinary";

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

      const sanitizedImages = images?.filter(
        (
          img: { url: string; publicId?: string }
        ): img is { url: string; publicId: string } => Boolean(img.url && img.publicId)
      );

      const product = await prisma.product.create({
        data: {
          ...productData,
          basePrice: price,
          images: sanitizedImages
            ? {
                create: sanitizedImages.map(
                  (img: { url: string; publicId: string }) => ({
                    url: img.url,
                    publicId: img.publicId,
                  })
                ),
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
        include: { product: { include: { images: true } }, event: true },
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
      const incomingImages = images as
        | { url: string; publicId?: string }[]
        | undefined;
      const existingImages = eventProduct.product.images || [];
      const existingIds = existingImages
        .map((img) => img.publicId)
        .filter(Boolean) as string[];

      if (incomingImages) {
        const incomingIds = incomingImages
          .map((img) => img.publicId)
          .filter(Boolean) as string[];

        const toDelete = existingImages.filter(
          (img) => img.publicId && !incomingIds.includes(img.publicId)
        );

        if (toDelete.length) {
          await Promise.all(
            toDelete.map(async (img) => {
              try {
                if (img.publicId) {
                  await cloudinary.uploader.destroy(img.publicId, {
                    resource_type: "image",
                  });
                }
              } catch (e) {
                console.error("Failed to delete Cloudinary image:", img.publicId, e);
              }
            })
          );

          await prisma.productImage.deleteMany({
            where: {
              productId: eventProduct.productId,
              publicId: { in: toDelete.map((img) => img.publicId!) },
            },
          });
        }

        const toAdd = incomingImages.filter(
          (
            img
          ): img is { url: string; publicId: string } =>
            Boolean(img.url && img.publicId && !existingIds.includes(img.publicId))
        );

        if (toAdd.length) {
          productUpdateData.images = {
            create: toAdd.map(({ url, publicId }) => ({
              url,
              publicId,
            })),
          };
        }
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
        include: { product: { include: { images: true } }, event: true },
      });

      if (!eventProduct)
        return res.status(404).json({ error: "Event product not found" });

      if (eventProduct.userId !== userId) {
        return res
          .status(403)
          .json({ error: "You can only delete your own products" });
      }

      const images = eventProduct.product.images || [];
      if (images.length) {
        await Promise.all(
          images
            .filter((img) => img.publicId)
            .map(async (img) => {
              try {
                await cloudinary.uploader.destroy(img.publicId!, {
                  resource_type: "image",
                });
              } catch (e) {
                console.error("Failed to delete Cloudinary image:", img.publicId, e);
              }
            })
        );
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
        include: { product: { include: { images: true } } },
      });

      for (const ep of eventProducts) {
        const imgs = ep.product.images || [];
        if (imgs.length) {
          await Promise.all(
            imgs
              .filter((img) => img.publicId)
              .map(async (img) => {
                try {
                  await cloudinary.uploader.destroy(img.publicId!, {
                    resource_type: "image",
                  });
                } catch (e) {
                  console.error(
                    "Failed to delete Cloudinary image:",
                    img.publicId,
                    e
                  );
                }
              })
          );
        }
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
