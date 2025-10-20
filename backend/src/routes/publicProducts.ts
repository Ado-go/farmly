import { Router } from "express";
import prisma from "../prisma.ts";

const router = Router();

// GET /products
router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        images: true,
        farm: { select: { id: true, name: true } },
        reviews: {
          select: { id: true, rating: true, comment: true, userId: true },
        },
      },
    });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /products/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const productId = Number(id);

  if (isNaN(productId)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        images: true,
        farm: { select: { id: true, name: true } },
        reviews: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product was not found" });
    }

    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
