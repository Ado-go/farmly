import { Router } from "express";
import prisma from "../prisma.ts";

const router = Router();

// GET /farms
router.get("/", async (req, res) => {
  try {
    const farms = await prisma.farm.findMany({
      include: {
        images: true,
        products: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            rating: true,
            images: true,
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.json(farms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /farm/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const farmId = Number(id);

  if (isNaN(farmId)) {
    return res.status(400).json({ error: "Invalid farm ID" });
  }

  try {
    const farm = await prisma.farm.findUnique({
      where: { id: Number(id) },
      include: {
        images: true,
        products: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true,
            price: true,
            rating: true,
            images: true,
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!farm) {
      return res.status(400).json({ error: "Farm was not found" });
    }
    res.json(farm);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
