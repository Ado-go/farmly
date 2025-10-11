import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.ts";
import cookieParser from "cookie-parser";
import prisma from "./prisma.ts";
import { authenticateToken, authorizeRole } from "./middleware/auth.ts";

const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173", // frontend URL
    credentials: true, // cookies
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/api/profile", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, role: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile loaded", user });
  } catch (err) {
    res.status(500).json({ message: "Error loading profile: " + err });
  }
});

app.get(
  "/api/farm",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          role: true,
        },
      });

      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ message: "Farm info", farm: user });
    } catch (err) {
      res.status(500).json({ message: "Error loading farm" });
    }
  }
);

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

app.get("/api/products", async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

export default app;

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}
