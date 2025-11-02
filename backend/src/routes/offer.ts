import { Router } from "express";
import prisma from "../prisma.ts";
import { authenticateToken } from "../middleware/auth.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import { offerSchema } from "../schemas/offerSchemas.ts";

const router = Router();

// POST /offer
router.post(
  "/",
  authenticateToken,
  validateRequest(offerSchema),
  async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const newProduct = await prisma.product.create({
        data: {
          name: req.body.product.name,
          category: req.body.product.category,
          description: req.body.product.description || "",
          basePrice: req.body.product.basePrice || req.body.price,
        },
      });

      const offer = await prisma.offer.create({
        data: {
          title: req.body.title,
          description: req.body.description,
          category: req.body.category,
          price: req.body.price,
          imageUrl: req.body.imageUrl,
          userId,
          productId: newProduct.id,
        },
        include: {
          product: true,
        },
      });

      res.status(201).json(offer);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to create offer." });
    }
  }
);

// GET /offer/all (public)
router.get("/all", async (req, res) => {
  try {
    const offers = await prisma.offer.findMany({
      where: { isActive: true },
      include: {
        product: true,
        user: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(offers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to fetch offers." });
  }
});

// GET /offer/my
router.get("/my", authenticateToken, async (req, res) => {
  const userId = req.user?.id;

  try {
    const offers = await prisma.offer.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(offers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to fetch your offers." });
  }
});

// UPDATE /offer/:id
router.put(
  "/:id",
  authenticateToken,
  validateRequest(offerSchema.partial()),
  async (req, res) => {
    const userId = req.user?.id;
    const offerId = parseInt(req.params.id);

    try {
      const offer = await prisma.offer.findUnique({ where: { id: offerId } });
      if (!offer) return res.status(404).json({ message: "Offer not found." });
      if (offer.userId !== userId)
        return res
          .status(403)
          .json({ message: "Not authorized to update this offer." });

      const updated = await prisma.offer.update({
        where: { id: offerId },
        data: req.body,
      });
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to update offer." });
    }
  }
);

// DELETE /offer/:id
router.delete("/:id", authenticateToken, async (req, res) => {
  const userId = req.user?.id;
  const offerId = parseInt(req.params.id);

  try {
    const offer = await prisma.offer.findUnique({ where: { id: offerId } });
    if (!offer) return res.status(404).json({ message: "Offer not found." });
    if (offer.userId !== userId)
      return res
        .status(403)
        .json({ message: "Not authorized to delete this offer." });

    await prisma.offer.delete({ where: { id: offerId } });
    res.json({ message: "Offer deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to delete offer." });
  }
});

export default router;
