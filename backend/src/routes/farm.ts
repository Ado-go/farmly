import { Router } from "express";
import prisma from "../prisma.ts";
import { farmSchema } from "../schemas/farmSchemas.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";

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
      const farm = await prisma.farm.create({
        data: {
          ...req.body,
          farmerId: userId,
        },
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

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized access" });
      }

      const farms = await prisma.farm.findMany({
        where: { farmerId: userId },
        select: {
          id: true,
          name: true,
          city: true,
          street: true,
          region: true,
          postalCode: true,
          country: true,
          description: true,
        },
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
    try {
      const userId = req.user?.id;
      const farmId = parseInt(req.params.id, 10);

      if (isNaN(farmId)) {
        return res.status(400).json({ message: "Invalid farm ID" });
      }

      const farm = await prisma.farm.findFirst({
        where: {
          id: farmId,
          farmerId: userId,
        },
        select: {
          id: true,
          name: true,
          city: true,
          street: true,
          region: true,
          postalCode: true,
          country: true,
          description: true,
        },
      });

      if (!farm) {
        return res
          .status(404)
          .json({ message: "Farm not found or unauthorized" });
      }

      res.json(farm);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error while loading farm" });
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

      if (isNaN(farmId)) {
        return res.status(400).json({ message: "Invalid farm ID" });
      }

      const existingFarm = await prisma.farm.findFirst({
        where: {
          id: farmId,
          farmerId: userId,
        },
      });

      if (!existingFarm) {
        return res
          .status(404)
          .json({ message: "Farm not found or unauthorized" });
      }

      const updatedFarm = await prisma.farm.update({
        where: { id: farmId },
        data: req.body,
      });

      res.json(updatedFarm);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to change farm info" });
    }
  }
);

// TODO: Delete products and deal with everything that comes with it.
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
        where: {
          id: farmId,
          farmerId: userId,
        },
      });

      if (!existingFarm) {
        return res
          .status(404)
          .json({ message: "Farm not found or unauthorized" });
      }

      await prisma.farm.delete({
        where: { id: farmId },
      });

      res.json({ message: "Farm was successfully deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to delete farm" });
    }
  }
);

export default router;
