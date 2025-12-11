import { Router } from "express";
import prisma from "../prisma.ts";
import argon2 from "argon2";
import { v2 as cloudinary } from "cloudinary";
import { authenticateToken } from "../middleware/auth.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import {
  deleteProfileSchema,
  updateProfileSchema,
} from "../schemas/profileSchema.ts";
import { sendEmail } from "../utils/sendEmails.ts";
import { buildAccountDeletionEmail } from "../emailTemplates/accountDeletionTemplate.ts";

const router = Router();

// GET /profile
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        address: true,
        postalCode: true,
        city: true,
        country: true,
        profileImageUrl: true,
        profileImagePublicId: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// PUT /profile
router.put(
  "/",
  authenticateToken,
  validateRequest(updateProfileSchema),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const {
        name,
        phone,
        address,
        postalCode,
        city,
        country,
        profileImageUrl,
        profileImagePublicId,
      } = req.body;

      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { profileImagePublicId: true },
      });

      const data: Record<string, any> = {
        name,
        phone,
        address,
        postalCode,
        city,
        country,
      };

      if (profileImageUrl !== undefined) {
        data.profileImageUrl = profileImageUrl;
      }
      if (profileImagePublicId !== undefined) {
        data.profileImagePublicId = profileImagePublicId;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          address: true,
          postalCode: true,
          city: true,
          country: true,
          profileImageUrl: true,
          profileImagePublicId: true,
        },
      });

      const oldPublicId = existingUser?.profileImagePublicId;
      const isReplacingImage =
        profileImagePublicId &&
        profileImagePublicId !== oldPublicId &&
        !!oldPublicId;
      const isRemovingImage =
        profileImagePublicId === null && !!oldPublicId;

      if (oldPublicId && (isReplacingImage || isRemovingImage)) {
        try {
          await cloudinary.uploader.destroy(oldPublicId, {
            resource_type: "image",
          });
        } catch (err) {
          console.error("Failed to delete old profile image", err);
        }
      }

      res.json({ user: updatedUser });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// DELETE /profile
router.delete(
  "/",
  authenticateToken,
  validateRequest(deleteProfileSchema),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const { password } = req.body;

      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: "User not found" });

      const valid = await argon2.verify(user.password, password);
      if (!valid)
        return res.status(403).json({ message: "Incorrect password" });

      if (user.profileImagePublicId) {
        try {
          await cloudinary.uploader.destroy(user.profileImagePublicId, {
            resource_type: "image",
          });
        } catch (err) {
          console.error("Failed to delete profile image", err);
        }
      }

      await prisma.user.delete({ where: { id: userId } });
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      const deletionDate = new Date().toISOString().split("T")[0];
      try {
        const { subject, html } = buildAccountDeletionEmail({
          name: user.name,
          deletionDate,
        });
        await sendEmail(user.email, subject, html);
      } catch (emailErr) {
        console.error("Failed to send account deletion email:", emailErr);
      }

      res.json({ message: "User deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
