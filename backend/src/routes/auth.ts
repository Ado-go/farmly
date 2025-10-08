import { Router } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import prisma from "../prisma.ts";
import { sendEmail } from "../utils/sendEmails.ts";

const router = Router();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET;

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign({ id: user.id }, REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  return { accessToken, refreshToken };
}

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

  const { accessToken, refreshToken } = generateTokens(user);

  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken },
  });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  });
});

// FORGOT password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: "User not found" });

  const resetToken = jwt.sign(
    { id: user.id, email: user.email },
    RESET_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  // ulož token do DB
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
    },
  });

  const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

  const html = `
    <h2>Resetovanie hesla</h2>
    <p>Klikni na tento odkaz pre obnovenie hesla (platný 15 minút):</p>
    <a href="${resetLink}" target="_blank">${resetLink}</a>
    <p>Ak si o reset nežiadal, ignoruj tento email.</p>
  `;

  try {
    await sendEmail(user.email, "Resetovanie hesla – Farmly", html);
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error sending email" });
  }
});

//RESET password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword)
    return res.status(400).json({ message: "Missing data" });

  try {
    const decoded = jwt.verify(token, RESET_TOKEN_SECRET!) as {
      id: number;
      email: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.resetToken !== token)
      return res.status(403).json({ message: "Invalid token" });

    const hashedPassword = await argon2.hash(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
      },
    });

    res.json({ message: "Password successfully reset" });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
});

// REFRESH token
router.post("/refresh", (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken)
    return res.status(401).json({ message: "Missing refresh token" });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET!);
    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      ACCESS_TOKEN_SECRET!,
      { expiresIn: "15m" }
    );

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.json({ message: "Access token refreshed" });
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Invalid or expired refresh token" });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (token) {
    try {
      const payload = jwt.verify(token, REFRESH_TOKEN_SECRET);
      await prisma.user.update({
        where: { id: payload.id },
        data: { refreshToken: null },
      });
    } catch {}
  }

  res.clearCookie("refreshToken");
  res.clearCookie("accessToken").json({ message: "Logged out" });
});
export default router;
