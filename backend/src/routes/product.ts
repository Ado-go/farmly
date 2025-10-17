import { Router } from "express";
import prisma from "../prisma";
import { productSchema } from "../schemas/productSchemas";
import { validateRequest } from "../middleware/validateRequest";
import {
  authenticateToken,
  authorizeRole,
  AuthRequest,
} from "../middleware/auth";

const router = Router();

const checkFarmOwnership = async (farmId: number, userId: number) => {
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (!farm) throw new Error("Farm not found");
  if (farm.farmerId !== userId) throw new Error("Not authorized for this farm");
  return true;
};

// POST /product
router.post(
  "/",
  authenticateToken,
  authorizeRole("FARMER"),
  validateRequest(productSchema),
  async (req: AuthRequest, res) => {
    try {
      const { images, farmId, ...productData } = req.body;

      await checkFarmOwnership(farmId, req.user.id);

      const product = await prisma.product.create({
        data: {
          ...productData,
          farmId,
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

      res.status(201).json(product);
    } catch (error: any) {
      res
        .status(403)
        .json({ error: error.message || "Failed to create product" });
    }
  }
);

// GET all products of the user's farm
router.get(
  "/farm/:farmId",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req: AuthRequest, res) => {
    try {
      const farmId = Number(req.params.farmId);
      await checkFarmOwnership(farmId, req.user.id);

      const products = await prisma.product.findMany({
        where: { farmId },
        include: { images: true },
      });

      res.json(products);
    } catch (error: any) {
      res
        .status(403)
        .json({ error: error.message || "Failed to fetch products" });
    }
  }
);

// GET /product/:id
router.get(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req: AuthRequest, res) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: Number(req.params.id) },
        include: { images: true, reviews: true },
      });

      if (!product) return res.status(404).json({ error: "Product not found" });

      const farm = await prisma.farm.findUnique({
        where: { id: product.farmId },
      });
      if (farm?.farmerId !== req.user.id)
        return res.status(403).json({ error: "Access denied" });

      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  }
);

// PUT /product/:id
router.put(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  validateRequest(productSchema.partial()),
  async (req: AuthRequest, res) => {
    try {
      const { images, farmId, ...updateData } = req.body;
      const productId = Number(req.params.id);

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) return res.status(404).json({ error: "Product not found" });

      await checkFarmOwnership(product.farmId, req.user.id);

      const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          ...updateData,
          ...(images && {
            images: {
              deleteMany: {},
              create: images.map((img: { url: string }) => ({ url: img.url })),
            },
          }),
        },
        include: { images: true },
      });

      res.json(updatedProduct);
    } catch (error: any) {
      res
        .status(403)
        .json({ error: error.message || "Failed to update product" });
    }
  }
);

// DELETE /product/:id
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req: AuthRequest, res) => {
    try {
      const productId = Number(req.params.id);
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) return res.status(404).json({ error: "Product not found" });

      await checkFarmOwnership(product.farmId, req.user.id);

      await prisma.product.delete({ where: { id: productId } });
      res.json({ message: "Product deleted" });
    } catch (error: any) {
      res
        .status(403)
        .json({ error: error.message || "Failed to delete product" });
    }
  }
);

// DELETE all products of a farm
router.delete(
  "/farm/:farmId",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req: AuthRequest, res) => {
    try {
      const farmId = Number(req.params.farmId);
      await checkFarmOwnership(farmId, req.user.id);

      await prisma.product.deleteMany({ where: { farmId } });
      res.json({ message: "All products deleted for this farm" });
    } catch (error: any) {
      res
        .status(403)
        .json({ error: error.message || "Failed to delete products" });
    }
  }
);

export default router;
