import { Router } from "express";
import prisma from "../prisma.ts";

const router = Router();

// GET /public-farm-products
router.get("/", async (req, res) => {
  try {
    const farmProducts = await prisma.farmProduct.findMany({
      include: {
        farm: { select: { id: true, name: true, city: true, region: true } },
        product: {
          include: {
            images: true,
            reviews: {
              select: {
                id: true,
                rating: true,
                comment: true,
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    const formatted = farmProducts.map((fp) => ({
      id: fp.id,
      price: fp.price,
      stock: fp.stock,
      createdAt: fp.createdAt,
      farm: fp.farm,
      product: {
        id: fp.product.id,
        name: fp.product.name,
        category: fp.product.category,
        description: fp.product.description,
        rating: fp.product.rating,
        images: fp.product.images,
        reviews: fp.product.reviews,
      },
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /public-farm-products/:id
router.get("/:id", async (req, res) => {
  const productId = Number(req.params.id);

  if (isNaN(productId)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const farmProduct = await prisma.farmProduct.findFirst({
      where: { productId },
      include: {
        farm: { select: { id: true, name: true, city: true, region: true } },
        product: {
          include: {
            images: true,
            reviews: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!farmProduct) {
      return res.status(404).json({ error: "Product was not found" });
    }

    const result = {
      id: farmProduct.id,
      price: farmProduct.price,
      stock: farmProduct.stock,
      createdAt: farmProduct.createdAt,
      farm: farmProduct.farm,
      product: {
        id: farmProduct.product.id,
        name: farmProduct.product.name,
        category: farmProduct.product.category,
        description: farmProduct.product.description,
        rating: farmProduct.product.rating,
        images: farmProduct.product.images,
        reviews: farmProduct.product.reviews,
      },
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
