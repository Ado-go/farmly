import { Router } from "express";
import prisma from "../prisma.ts";
import { authenticateToken } from "../middleware/auth.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import { offerSchema } from "../schemas/offerSchemas.ts";
import { v2 as cloudinary } from "cloudinary";

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
      const { product, ...offerPayload } = req.body;
      const productImages = product.images || [];

      const newProduct = await prisma.product.create({
        data: {
          name: product.name,
          category: product.category,
          description: product.description || "",
          basePrice: product.basePrice ?? offerPayload.price,
          images: productImages.length
            ? {
                create: productImages.map((img: { url: string; publicId: string }) => ({
                  url: img.url,
                  publicId: img.publicId,
                })),
              }
            : undefined,
        },
        include: { images: true },
      });

      const offer = await prisma.offer.create({
        data: {
          title: offerPayload.title,
          description: offerPayload.description,
          category: offerPayload.category,
          price: offerPayload.price,
          userId,
          productId: newProduct.id,
        },
        include: {
          product: { include: { images: true } },
          user: { select: { id: true, name: true } },
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
        product: { include: { images: true } },
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
      include: { product: { include: { images: true } } },
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
      const existingOffer = await prisma.offer.findUnique({
        where: { id: offerId },
        include: { product: { include: { images: true } } },
      });
      if (!existingOffer)
        return res.status(404).json({ message: "Offer not found." });
      if (existingOffer.userId !== userId)
        return res
          .status(403)
          .json({ message: "Not authorized to update this offer." });

      const { product: productPayload, ...offerPayload } = req.body;

      const updated = await prisma.$transaction(async (tx) => {
        if (productPayload) {
          const productUpdateData = Object.fromEntries(
            Object.entries({
              name: productPayload.name,
              category: productPayload.category,
              description: productPayload.description,
              basePrice: productPayload.basePrice,
            }).filter(([, value]) => value !== undefined)
          );

          if (productPayload.images) {
            const incomingImages = productPayload.images;
            const existingImages = existingOffer.product.images || [];
            const existingIds = existingImages.map((img) => img.publicId);
            const incomingIds = incomingImages.map(
              (img: { publicId: string }) => img.publicId
            );

            const toDelete = existingImages.filter(
              (img) => !incomingIds.includes(img.publicId)
            );

            if (toDelete.length > 0) {
              await Promise.all(
                toDelete.map(async (img) => {
                  try {
                    await cloudinary.uploader.destroy(img.publicId, {
                      resource_type: "image",
                    });
                  } catch (e) {
                    console.error(
                      "Failed to delete Cloudinary image:",
                      img.publicId,
                      e
                    );
                  }
                })
              );

              await tx.productImage.deleteMany({
                where: {
                  productId: existingOffer.productId,
                  publicId: { in: toDelete.map((img) => img.publicId) },
                },
              });
            }

            const toAdd = incomingImages.filter(
              (img: { publicId: string }) => !existingIds.includes(img.publicId)
            );

            if (toAdd.length > 0) {
              await tx.productImage.createMany({
                data: toAdd.map(
                  (img: { url: string; publicId: string }) => ({
                    productId: existingOffer.productId,
                    url: img.url,
                    publicId: img.publicId,
                  })
                ),
              });
            }
          }

          if (Object.keys(productUpdateData).length > 0) {
            await tx.product.update({
              where: { id: existingOffer.productId },
              data: productUpdateData,
            });
          }
        }

        const offerUpdateData = Object.fromEntries(
          Object.entries({
            title: offerPayload.title,
            description: offerPayload.description,
            category: offerPayload.category,
            price: offerPayload.price,
            isActive: offerPayload.isActive,
          }).filter(([, value]) => value !== undefined)
        );

        if (Object.keys(offerUpdateData).length > 0) {
          return tx.offer.update({
            where: { id: offerId },
            data: offerUpdateData,
            include: {
              product: { include: { images: true } },
              user: { select: { id: true, name: true } },
            },
          });
        }

        return tx.offer.findUnique({
          where: { id: offerId },
          include: {
            product: { include: { images: true } },
            user: { select: { id: true, name: true } },
          },
        });
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
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { product: { include: { images: true } } },
    });
    if (!offer) return res.status(404).json({ message: "Offer not found." });
    if (offer.userId !== userId)
      return res
        .status(403)
        .json({ message: "Not authorized to delete this offer." });

    await prisma.$transaction(async (tx) => {
      const images = offer.product?.images ?? [];

      if (images.length > 0) {
        await Promise.all(
          images.map(async (img) => {
            try {
              await cloudinary.uploader.destroy(img.publicId, {
                resource_type: "image",
              });
            } catch (e) {
              console.error("Failed to delete Cloudinary image:", img.publicId, e);
            }
          })
        );

        await tx.productImage.deleteMany({
          where: { productId: offer.productId },
        });
      }

      await tx.offer.delete({ where: { id: offerId } });
      await tx.product.delete({ where: { id: offer.productId } });
    });

    res.json({ message: "Offer deleted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to delete offer." });
  }
});

export default router;
