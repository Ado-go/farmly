import { Router } from "express";
import prisma from "../prisma.ts";
import { productSchema } from "../schemas/farmProductSchemas.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

const checkFarmOwnership = async (
  farmId: number,
  userId: number | undefined
) => {
  if (!userId) {
    const err: any = new Error("Unauthorized");
    err.status = 403;
    throw err;
  }

  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) {
    const err: any = new Error("Farm not found");
    err.status = 400;
    throw err;
  }

  if (farm.farmerId !== userId) {
    const err: any = new Error("Not authorized for this farm");
    err.status = 403;
    throw err;
  }

  return true;
};

// POST /farm-product
router.post(
  "/",
  authenticateToken,
  authorizeRole("FARMER"),
  validateRequest(productSchema),
  async (req, res) => {
    try {
      const { images, farmId, price, stock, isAvailable, ...productData } =
        req.body;

      await checkFarmOwnership(farmId, req.user?.id);

      const product = await prisma.product.create({
        data: {
          ...productData,
          basePrice: price,
          images: images
            ? {
                create: images.map(
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

      const farmProduct = await prisma.farmProduct.create({
        data: {
          farm: { connect: { id: farmId } },
          product: { connect: { id: product.id } },
          price: price ?? 0,
          stock: stock ?? 0,
          isAvailable: isAvailable ?? true,
        },
        include: {
          product: { include: { images: true } },
          farm: { select: { id: true, name: true } },
        },
      });

      res.status(201).json(farmProduct);
    } catch (error: any) {
      const status = error.status || 400;
      res
        .status(status)
        .json({ error: error.message || "Failed to create farm product" });
    }
  }
);

// GET /farm-product/all
router.get(
  "/all",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      const farms = await prisma.farm.findMany({
        where: { farmerId: userId },
        include: {
          farmProducts: {
            include: {
              product: { include: { images: true } },
              farm: { select: { id: true, name: true } },
            },
          },
        },
      });

      const allFarmProducts = farms.flatMap((f) => f.farmProducts ?? []) ?? [];
      res.status(200).json(allFarmProducts);
    } catch (error: any) {
      console.error("ERROR /farm-product/all:", error);
      res
        .status(400)
        .json({ error: error.message || "Failed to fetch farm products" });
    }
  }
);

// GET /farm-product/farm/:farmId
router.get(
  "/farm/:farmId",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const farmId = Number(req.params.farmId);
      await checkFarmOwnership(farmId, req.user?.id);

      const farmProducts = await prisma.farmProduct.findMany({
        where: { farmId },
        include: {
          product: { include: { images: true, reviews: true } },
        },
      });

      res.json(farmProducts);
    } catch (error: any) {
      const status = error.status || 400;
      res
        .status(status)
        .json({ error: error.message || "Failed to fetch farm products" });
    }
  }
);

// GET /farm-product/:id
router.get(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const farmProduct = await prisma.farmProduct.findUnique({
        where: { id },
        include: {
          product: { include: { images: true, reviews: true } },
          farm: true,
        },
      });

      if (!farmProduct)
        return res.status(404).json({ error: "Farm product not found" });
      await checkFarmOwnership(farmProduct.farmId, req.user?.id);
      res.json(farmProduct);
    } catch (error: any) {
      const status = error.status || 400;
      res
        .status(status)
        .json({ error: error.message || "Failed to fetch farm product" });
    }
  }
);

// PUT /farm-product/:id
router.put(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  validateRequest(productSchema.partial()),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const {
        images = [],
        price,
        stock,
        name,
        category,
        description,
        isAvailable,
      } = req.body;

      const farmProduct = await prisma.farmProduct.findUnique({
        where: { id },
        include: { product: { include: { images: true } } },
      });

      if (!farmProduct)
        return res.status(404).json({ error: "Farm product not found" });
      await checkFarmOwnership(farmProduct.farmId, req.user?.id);

      const oldImages = farmProduct.product.images;
      const oldIds = oldImages.map((i) => i.publicId);
      const newIds = images.map((i: any) => i.publicId);

      const toDelete = oldIds.filter((pid) => !newIds.includes(pid));

      for (const publicId of toDelete) {
        try {
          await cloudinary.uploader.destroy(publicId);
          await prisma.productImage.deleteMany({ where: { publicId } });
        } catch (e) {
          console.warn(`Could not delete ${publicId}:`, e);
        }
      }

      const toAdd = images.filter((img: any) => !oldIds.includes(img.publicId));

      const updated = await prisma.farmProduct.update({
        where: { id },
        data: {
          price: price ?? farmProduct.price,
          stock: stock ?? farmProduct.stock,
          ...(isAvailable !== undefined && { isAvailable }),
          product: {
            update: {
              ...(name && { name }),
              ...(category && { category }),
              ...(description && { description }),
              images: {
                create: toAdd.map((img: any) => ({
                  url: img.url,
                  publicId: img.publicId,
                })),
              },
            },
          },
        },
        include: {
          product: { include: { images: true } },
          farm: { select: { id: true, name: true } },
        },
      });

      res.json(updated);
    } catch (error: any) {
      const status = error.status || 400;
      res
        .status(status)
        .json({ error: error.message || "Failed to update farm product" });
    }
  }
);

// DELETE /farm-product/:id
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const farmProduct = await prisma.farmProduct.findUnique({
        where: { id },
        include: { farm: true, product: { include: { images: true } } },
      });
      if (!farmProduct)
        return res.status(404).json({ error: "Farm product not found" });

      await checkFarmOwnership(farmProduct.farmId, req.user?.id);

      for (const img of farmProduct.product.images) {
        try {
          await cloudinary.uploader.destroy(img.publicId);
        } catch (e) {
          console.warn(`Could not delete ${img.publicId}:`, e);
        }
      }

      await prisma.farmProduct.delete({ where: { id } });
      await prisma.product.delete({ where: { id: farmProduct.product.id } });

      res.json({ message: "Farm product deleted" });
    } catch (error: any) {
      const status = error.status || 400;
      res
        .status(status)
        .json({ error: error.message || "Failed to delete farm product" });
    }
  }
);

export default router;
