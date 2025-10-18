import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import prisma from "./prisma.ts";

import authRoutes from "./routes/auth.ts";

import profileRoutes from "./routes/profile.ts";

import farmRoutes from "./routes/farm.ts";

import productRoutes from "./routes/product.ts";

import publicProductsRoutes from "./routes/publicProducts.ts";

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

app.use("/api/profile", profileRoutes);

app.use("/api/farm", farmRoutes);

app.use("/api/product", productRoutes);

app.use("/api/products", publicProductsRoutes);

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

export default app;

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}
