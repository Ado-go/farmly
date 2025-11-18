import { Router } from "express";
import prisma from "../prisma.ts";
import argon2 from "argon2";
import { authenticateToken } from "../middleware/auth.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import {
  deleteProfileSchema,
  updateProfileSchema,
} from "../schemas/profileSchema.ts";

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

      const { name, phone, address, postalCode, city, country } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { name, phone, address, postalCode, city, country },
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
        },
      });

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

      await prisma.user.delete({ where: { id: userId } });
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");

      res.json({ message: "User deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
