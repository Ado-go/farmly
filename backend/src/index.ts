import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.ts";

import profileRoutes from "./routes/profile.ts";

import farmRoutes from "./routes/farm.ts";

import productRoutes from "./routes/product.ts";

// public routes //
import publicProductsRoutes from "./routes/publicProducts.ts";

import publicFarmsRoutes from "./routes/publicFarms.ts";

const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL, // frontend URL
    credentials: true, // cookies
  })
);
app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/farm", farmRoutes);

app.use("/api/product", productRoutes);

// Public //
app.use("/api/products", publicProductsRoutes);

app.use("/api/farms", publicFarmsRoutes);

// test routes //
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

export default app;

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}
