import { Router } from "express";
import prisma from "../prisma.ts";

const router = Router();

// GET /farms
router.get("/", async (req, res) => {
  try {
    const farms = await prisma.farm.findMany({
      include: {
        images: true,
        farmer: { select: { id: true, name: true } },
        farmProducts: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    const formatted = farms.map((farm) => ({
      id: farm.id,
      name: farm.name,
      description: farm.description,
      city: farm.city,
      street: farm.street,
      region: farm.region,
      postalCode: farm.postalCode,
      country: farm.country,
      farmer: farm.farmer,
      images: farm.images,
      farmProducts: farm.farmProducts.map((fp) => ({
        id: fp.id,
        price: fp.price,
        stock: fp.stock,
        product: {
          id: fp.product.id,
          name: fp.product.name,
          category: fp.product.category,
          description: fp.product.description,
          images: fp.product.images,
        },
      })),
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /farms/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const farmId = Number(id);

  if (isNaN(farmId)) {
    return res.status(400).json({ error: "Invalid farm ID" });
  }

  try {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        images: true,
        farmer: { select: { id: true, name: true } },
        farmProducts: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
          },
        },
      },
    });

    if (!farm) {
      return res.status(404).json({ error: "Farm was not found" });
    }

    const formatted = {
      id: farm.id,
      name: farm.name,
      description: farm.description,
      city: farm.city,
      street: farm.street,
      region: farm.region,
      postalCode: farm.postalCode,
      country: farm.country,
      farmer: farm.farmer,
      images: farm.images,
      farmProducts: farm.farmProducts.map((fp) => ({
        id: fp.id,
        price: fp.price,
        stock: fp.stock,
        product: {
          id: fp.product.id,
          name: fp.product.name,
          category: fp.product.category,
          description: fp.product.description,
          images: fp.product.images,
        },
      })),
    };

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
