import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.ts";

import profileRoutes from "./routes/profile.ts";

import farmRoutes from "./routes/farm.ts";

import farmProductRoutes from "./routes/farmProduct.ts";

import reviewRoutes from "./routes/review.ts";

import eventRoutes from "./routes/event.ts";

import eventProductRoutes from "./routes/eventProduct.ts";

// mix public private //
import offerRoutes from "./routes/offer.ts";

// public routes //
import publicFarmProductsRoutes from "./routes/publicFarmProducts.ts";

import publicFarmsRoutes from "./routes/publicFarms.ts";

import publicEventsRoutes from "./routes/publicEvents.ts";

import publicStatsRoutes from "./routes/publicStats.ts";

// checkouts

import checkoutRoutes from "./routes/checkout.ts";

import checkoutPreorderRoutes from "./routes/checkoutPreorder.ts";

import ordersRoutes from "./routes/orders.ts";

// uploads images
import uploadRouter from "./routes/upload.ts";

const app = express();
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL, // frontend URL
    credentials: true, // cookies
  })
);

app.post(
  "/api/checkout/stripe/webhook",
  express.raw({ type: "application/json" })
);

// Skip JSON parsing for Stripe webhook so signature verification uses raw body
app.use((req, res, next) => {
  if (req.originalUrl === "/api/checkout/stripe/webhook") {
    return next();
  }
  return express.json()(req, res, next);
});

app.use("/api/auth", authRoutes);

app.use("/api/profile", profileRoutes);

app.use("/api/farm", farmRoutes);

app.use("/api/farm-product", farmProductRoutes);

app.use("/api/review", reviewRoutes);

app.use("/api/event", eventRoutes);

app.use("/api/event-product", eventProductRoutes);

// MIX Public/private
app.use("/api/offer", offerRoutes);

// Public //
app.use("/api/public-farm-products", publicFarmProductsRoutes);

app.use("/api/farms", publicFarmsRoutes);

app.use("/api/public-events", publicEventsRoutes);

app.use("/api/public-stats", publicStatsRoutes);

// checkouts

app.use("/api/checkout", checkoutRoutes);

app.use("/api/checkout-preorder", checkoutPreorderRoutes);

app.use("/api/orders", ordersRoutes);

// upload images

app.use("/api", uploadRouter);

// test routes //
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

export default app;

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}
