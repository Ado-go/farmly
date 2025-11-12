import { Router } from "express";
import prisma from "../prisma.ts";
import { farmSchema } from "../schemas/farmSchemas.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

// POST /farm
router.post(
  "/",
  authenticateToken,
  authorizeRole("FARMER"),
  validateRequest(farmSchema),
  async (req, res) => {
    const userId = req.user?.id;
    try {
      const { images = [], ...data } = req.body;

      const farm = await prisma.farm.create({
        data: {
          ...data,
          farmerId: userId,
          images: {
            create: images.map((img: { url: string; publicId: string }) => ({
              url: img.url,
              publicId: img.publicId,
            })),
          },
        },
        include: { images: true },
      });

      res.status(201).json(farm);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to create farm" });
    }
  }
);

// GET /farm
router.get(
  "/",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const farms = await prisma.farm.findMany({
        where: { farmerId: userId },
        include: { images: true },
      });
      res.json(farms);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to load farms" });
    }
  }
);

// GET /farm/:id
router.get(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    const userId = req.user?.id;
    const farmId = parseInt(req.params.id, 10);
    try {
      const farm = await prisma.farm.findFirst({
        where: { id: farmId, farmerId: userId },
        include: { images: true },
      });
      if (!farm) return res.status(404).json({ message: "Farm not found" });
      res.json(farm);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error loading farm" });
    }
  }
);

// PUT /farm/:id
router.put(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  validateRequest(farmSchema.partial()),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const farmId = parseInt(req.params.id, 10);
      const { images = [], ...data } = req.body as {
        images?: { url: string; publicId: string }[];
        [k: string]: any;
      };

      const existing = await prisma.farm.findFirst({
        where: { id: farmId, farmerId: userId },
        include: { images: true },
      });

      if (!existing)
        return res
          .status(404)
          .json({ message: "Farm not found or unauthorized" });

      const existingPublicIds = existing.images.map((i) => i.publicId);
      const newPublicIds = (images || [])
        .map((i) => i.publicId)
        .filter(Boolean);

      const toDelete = existingPublicIds.filter(
        (pid) => !newPublicIds.includes(pid)
      );

      await prisma.$transaction(async (tx) => {
        if (toDelete.length > 0) {
          await Promise.all(
            toDelete.map(async (pid) => {
              try {
                await cloudinary.uploader.destroy(pid, {
                  resource_type: "image",
                });
              } catch (e) {
                console.error("Failed to delete Cloudinary image:", pid, e);
              }
            })
          );

          await tx.farmImage.deleteMany({
            where: { farmId, publicId: { in: toDelete } },
          });
        }

        const newImages = (images || []).filter(
          (img) => !existingPublicIds.includes(img.publicId)
        );

        if (newImages.length > 0) {
          await tx.farmImage.createMany({
            data: newImages.map((img) => ({
              url: img.url,
              publicId: img.publicId,
              farmId,
            })),
          });
        }

        await tx.farm.update({
          where: { id: farmId },
          data,
        });
      });

      const updatedFarm = await prisma.farm.findUnique({
        where: { id: farmId },
        include: { images: true },
      });

      res.json(updatedFarm);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to change farm info" });
    }
  }
);

// DELETE /farm/:id
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const farmId = parseInt(req.params.id, 10);

      if (isNaN(farmId)) {
        return res.status(400).json({ message: "Invalid farm ID" });
      }

      const existingFarm = await prisma.farm.findFirst({
        where: { id: farmId, farmerId: userId },
        include: { images: true },
      });

      if (!existingFarm) {
        return res
          .status(404)
          .json({ message: "Farm not found or unauthorized" });
      }

      const publicIds = (existingFarm.images || []).map((i) => i.publicId);

      await prisma.$transaction(async (tx) => {
        if (publicIds.length > 0) {
          await Promise.all(
            publicIds.map(async (pid) => {
              try {
                await cloudinary.uploader.destroy(pid, {
                  resource_type: "image",
                });
              } catch (e) {
                console.error("Failed to delete Cloudinary image:", pid, e);
              }
            })
          );
          await tx.farmImage.deleteMany({
            where: { farmId, publicId: { in: publicIds } },
          });
        }

        await tx.farm.delete({ where: { id: farmId } });
      });

      res.json({ message: "Farm was successfully deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to delete farm" });
    }
  }
);

export default router;
