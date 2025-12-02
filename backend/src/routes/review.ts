import { Router } from "express";
import prisma from "../prisma.ts";
import { authenticateToken } from "../middleware/auth.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import {
  reviewCreateSchema,
  reviewUpdateSchema,
} from "../schemas/reviewSchemas.ts";

const router = Router();

const recomputeProductRating = async (productId: number) => {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: { rating: agg._avg.rating ?? 0 },
  });
};

// GET /review
router.get("/", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /review/product/:productId
router.get("/product/:productId", async (req, res) => {
  const productId = Number(req.params.productId);
  if (isNaN(productId))
    return res.status(400).json({ error: "Invalid product ID" });

  try {
    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /review
router.post(
  "/",
  authenticateToken,
  validateRequest(reviewCreateSchema),
  async (req: any, res) => {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!productId || isNaN(Number(productId)))
      return res.status(400).json({ error: "Product ID is required" });

    try {
      const review = await prisma.review.create({
        data: {
          rating,
          comment,
          productId: Number(productId),
          userId,
        },
      });

      await recomputeProductRating(Number(productId));

      res.status(201).json(review);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PUT /review/:id
router.put(
  "/:id",
  authenticateToken,
  validateRequest(reviewUpdateSchema),
  async (req: any, res) => {
    const id = Number(req.params.id);
    const { rating, comment } = req.body;

    if (isNaN(id)) return res.status(400).json({ error: "Invalid review ID" });

    try {
      const existing = await prisma.review.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: "Review not found" });
      if (existing.userId !== req.user.id)
        return res.status(403).json({ error: "Not authorized" });

      const updated = await prisma.review.update({
        where: { id },
        data: { rating, comment },
      });

      await recomputeProductRating(existing.productId);

      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// DELETE /review/:id
router.delete("/:id", authenticateToken, async (req: any, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid review ID" });

  try {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ error: "Review not found" });
    if (review.userId !== req.user.id)
      return res.status(403).json({ error: "Not authorized" });

    await prisma.review.delete({ where: { id } });
    await recomputeProductRating(review.productId);

    res.json({ message: "Review deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
