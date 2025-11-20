import { Router } from "express";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import prisma from "../prisma.ts";
import { sendEmail } from "../utils/sendEmails.ts";
import type { User } from "@prisma/client";
import { validateRequest } from "../middleware/validateRequest.ts";
import { loginSchema, registerSchema } from "../schemas/authSchemas.ts";
import { authenticateToken } from "../middleware/auth.ts";

const router = Router();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
const RESET_TOKEN_SECRET = process.env.RESET_TOKEN_SECRET;
const isProduction = process.env.NODE_ENV === "production";
const accessCookieOptions = {
  httpOnly: true as const,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  maxAge: 15 * 60 * 1000, // 15 min
};
const refreshCookieOptions = {
  httpOnly: true as const,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET || !RESET_TOKEN_SECRET) {
  throw new Error("Missing JWT secrets in environment variables");
}

function generateTokens(user: User) {
  if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
    throw new Error("Missing JWT secrets in environment variables");
  }

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );

  const refreshToken = jwt.sign(
    { id: user.id, role: user.role },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return { accessToken, refreshToken };
}

// Register
router.post("/register", validateRequest(registerSchema), async (req, res) => {
  const {
    email,
    password,
    role,
    name,
    phone,
    address,
    postalCode,
    city,
    country,
  } = req.body;

  if (
    !email ||
    !password ||
    !role ||
    !name ||
    !phone ||
    !address ||
    !postalCode ||
    !city ||
    !country
  ) {
    return res
      .status(400)
      .json({ error: "Missing required registration fields" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(400).json({ message: "User already exists" });
  }

  try {
    const hashed = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        role,
        name,
        phone,
        address,
        postalCode,
        city,
        country,
      },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone,
        address: user.address,
        postalCode: user.postalCode,
        city: user.city,
        country: user.country,
        profileImageUrl: user.profileImageUrl,
        profileImagePublicId: user.profileImagePublicId,
      },
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Login
router.post("/login", validateRequest(loginSchema), async (req, res) => {
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

  res.cookie("accessToken", accessToken, accessCookieOptions);
  res.cookie("refreshToken", refreshToken, refreshCookieOptions);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      phone: user.phone,
      address: user.address,
      postalCode: user.postalCode,
      city: user.city,
      country: user.country,
      profileImageUrl: user.profileImageUrl,
      profileImagePublicId: user.profileImagePublicId,
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
    <br>
    <h2>Password reset</h2>
    <p>Click this link to reset your password (valid for 15 minutes):</p>
    <a href="${resetLink}" target="_blank">${resetLink}</a>
    <p>If you did not request a reset, please ignore this email.</p>
  `;

  try {
    await sendEmail(
      user.email,
      "Resetovanie hesla(Password reset) - Farmly",
      html
    );
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

//CHANGE password
router.post("/change-password", authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!oldPassword || !newPassword)
    return res.status(400).json({ message: "Missing data" });

  if (oldPassword === newPassword)
    return res
      .status(400)
      .json({ message: "New password must differ from old password" });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ message: "Invalid user id" });
  const valid = await argon2.verify(user.password, oldPassword);
  if (!valid) return res.status(401).json({ message: "Invalid password" });

  try {
    const hashedPassword = await argon2.hash(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      },
    });

    res.json({ message: "Password successfully changed" });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
});

// REFRESH token
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(401).json({ message: "Missing refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET!) as {
      id: number;
      role: string;
    };

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.refreshToken !== refreshToken) {
      return res
        .status(403)
        .json({ message: "Invalid or revoked refresh token" });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      generateTokens(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: newRefreshToken },
    });

    res.cookie("accessToken", newAccessToken, accessCookieOptions);
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

    res.json({ message: "Access token refreshed" });
  } catch (err) {
    console.error("Refresh token error:", err);
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
      const payload = jwt.verify(token, REFRESH_TOKEN_SECRET) as {
        id: number;
        role: string;
      };
      await prisma.user.update({
        where: { id: payload.id },
        data: { refreshToken: null },
      });
    } catch {}
  }

  res.clearCookie("refreshToken", refreshCookieOptions);
  res.clearCookie("accessToken", accessCookieOptions).json({ message: "Logged out" });
});
export default router;
