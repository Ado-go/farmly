import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.ts";

import profileRoutes from "./routes/profile.ts";

import farmRoutes from "./routes/farm.ts";

import farmProductRoutes from "./routes/farmProduct.ts";

import reviewRoutes from "./routes/review.ts";

import eventRoutes from "./routes/event.ts";

// public routes //
import publicFarmProductsRoutes from "./routes/publicFarmProducts.ts";

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

app.use("/api/farm-product", farmProductRoutes);

app.use("/api/review", reviewRoutes);

app.use("/api/event", eventRoutes);

// Public //
app.use("/api/public-farm-products", publicFarmProductsRoutes);

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
