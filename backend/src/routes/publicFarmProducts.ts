import { Router } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prisma.ts";
import {
  buildPaginationResponse,
  getPaginationParams,
} from "../utils/pagination.ts";

const router = Router();

const SORT_OPTIONS = ["newest", "price", "rating", "popular"] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

const ORDER_DIRECTIONS = ["asc", "desc"] as const;
type OrderDirection = (typeof ORDER_DIRECTIONS)[number];

const isSortOption = (value: unknown): value is SortOption =>
  typeof value === "string" && SORT_OPTIONS.includes(value as SortOption);

const isOrderDirection = (value: unknown): value is OrderDirection =>
  typeof value === "string" &&
  ORDER_DIRECTIONS.includes(value as OrderDirection);

const toNumber = (value: unknown) => {
  if (value === null || value === undefined) return null;
  if (typeof (value as any)?.toNumber === "function")
    return (value as any).toNumber();
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const deriveRating = (rawRating: unknown) => {
  const numericRating = toNumber(rawRating);
  return numericRating !== null ? Number(numericRating.toFixed(1)) : null;
};

const buildOrderBy = (
  sort: SortOption,
  direction: OrderDirection
): Prisma.FarmProductOrderByWithRelationInput[] => {
  switch (sort) {
    case "price":
      return [{ price: direction }, { createdAt: "desc" }];
    case "rating":
      return [
        { product: { rating: direction } },
        { createdAt: "desc" },
      ];
    case "popular":
      return [
        { product: { orderItems: { _count: direction } } },
        { createdAt: "desc" },
      ];
    case "newest":
    default:
      return [{ createdAt: direction }];
  }
};

// GET /public-farm-products
router.get("/", async (req, res) => {
  try {
    const { page, pageSize, skip, take } = getPaginationParams(req.query);
    const sort = isSortOption(req.query.sort) ? req.query.sort : "newest";
    const order = isOrderDirection(req.query.order)
      ? req.query.order
      : sort === "price"
      ? "asc"
      : "desc";
    const category =
      typeof req.query.category === "string" && req.query.category.trim()
        ? req.query.category.trim()
        : undefined;
    const search =
      typeof req.query.search === "string" && req.query.search.trim()
        ? req.query.search.trim()
        : undefined;

    const where: Prisma.FarmProductWhereInput = { isAvailable: true };

    if (category || search) {
      where.product = {};

      if (category) {
        where.product.category = category as any;
      }

      if (search) {
        where.product.name = {
          contains: search,
          mode: "insensitive",
        };
      }
    }

    const [farmProducts, total] = await Promise.all([
      prisma.farmProduct.findMany({
        skip,
        take,
        where,
        orderBy: buildOrderBy(sort, order),
        include: {
          farm: { select: { id: true, name: true, city: true, region: true } },
          product: {
            include: {
              images: true,
              reviews: {
                select: {
                  id: true,
                  rating: true,
                  comment: true,
                  user: { select: { id: true, name: true } },
                },
              },
              _count: { select: { orderItems: true } },
            },
          },
        },
      }),
      prisma.farmProduct.count({ where }),
    ]);

    const formatted = farmProducts.map((fp) => ({
      id: fp.id,
      price: fp.price,
      stock: fp.stock,
      isAvailable: fp.isAvailable,
      createdAt: fp.createdAt,
      farm: fp.farm,
      product: {
        id: fp.product.id,
        name: fp.product.name,
        category: fp.product.category,
        description: fp.product.description,
        rating: deriveRating(fp.product.rating),
        images: fp.product.images,
        reviews: fp.product.reviews,
        salesCount: fp.product._count?.orderItems ?? 0,
      },
    }));

    res.json(buildPaginationResponse(formatted, page, pageSize, total));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /public-farm-products/:id
router.get("/:id", async (req, res) => {
  const productId = Number(req.params.id);

  if (isNaN(productId)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const farmProduct = await prisma.farmProduct.findFirst({
      where: { productId, isAvailable: true },
      include: {
        farm: { select: { id: true, name: true, city: true, region: true } },
        product: {
          include: {
            images: true,
            reviews: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!farmProduct) {
      return res.status(404).json({ error: "Product was not found" });
    }

    const result = {
      id: farmProduct.id,
      price: farmProduct.price,
      stock: farmProduct.stock,
      isAvailable: farmProduct.isAvailable,
      createdAt: farmProduct.createdAt,
      farm: farmProduct.farm,
      product: {
        id: farmProduct.product.id,
        name: farmProduct.product.name,
        category: farmProduct.product.category,
        description: farmProduct.product.description,
        rating: deriveRating(farmProduct.product.rating),
        images: farmProduct.product.images,
        reviews: farmProduct.product.reviews,
      },
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
