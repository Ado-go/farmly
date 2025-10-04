import { Router } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import prisma from "../prisma.ts";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "";

// Register
router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Missing email or password or role" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ message: "User already exists" });
  }

  try {
    const hashed = await argon2.hash(password);

    const user = await prisma.user.create({
      data: { email, password: hashed, role },
    });
    res.json({ id: user.id, email: user.email, role: user.role });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await argon2.verify(user.password, password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );

  res.json({ token });
});

// Logout
router.post("/logout", (_req, res) => {
  res.json({ message: "Logged out (client should delete token)" });
});
export default router;
