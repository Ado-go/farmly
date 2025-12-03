import { Router } from "express";
import { Prisma, ProductCategory } from "@prisma/client";
import prisma from "../prisma.ts";
import {
  buildPaginationResponse,
  getPaginationParams,
} from "../utils/pagination.ts";

const router = Router();

const parseCategory = (
  value: unknown
): ProductCategory | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return Object.values(ProductCategory).includes(trimmed as ProductCategory)
    ? (trimmed as ProductCategory)
    : undefined;
};

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

// GET /farms
router.get("/", async (req, res) => {
  try {
    const { page, pageSize, skip, take } = getPaginationParams(req.query);
    const category = parseCategory(req.query.category);
    const search =
      typeof req.query.search === "string" && req.query.search.trim()
        ? req.query.search.trim()
        : undefined;

    const where: Prisma.FarmWhereInput = {};

    const filters: Prisma.FarmWhereInput[] = [];

    if (search) {
      filters.push({
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { farmer: { name: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    if (category) {
      filters.push({ farmProducts: { some: { product: { category } } } });
    }

    if (filters.length > 0) {
      where.AND = filters;
    }

    const farmInclude = {
      images: true,
      farmer: {
        select: { id: true, name: true, profileImageUrl: true },
      },
      farmProducts: {
        where: category ? { product: { category } } : undefined,
        include: {
          product: {
            include: {
              images: true,
              reviews: {
                include: { user: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
    } satisfies Prisma.FarmInclude;

    const [farms, total] = await Promise.all([
      prisma.farm.findMany({
        skip,
        take,
        where,
        orderBy: { createdAt: "desc" },
        include: farmInclude,
      }),
      prisma.farm.count({ where }),
    ]);

    const formatted = farms.map((farm) => ({
      id: farm.id,
      name: farm.name,
      description: farm.description,
      city: farm.city,
      street: farm.street,
      region: farm.region,
      postalCode: farm.postalCode,
      country: farm.country,
      farmer: farm.farmer,
      images: farm.images,
      farmProducts: farm.farmProducts.map((fp) => ({
        id: fp.id,
        price: fp.price,
        stock: fp.stock,
        product: {
          id: fp.product.id,
          name: fp.product.name,
          category: fp.product.category,
          description: fp.product.description,
          rating: deriveRating(fp.product.rating),
          images: fp.product.images,
          reviews: fp.product.reviews,
        },
      })),
    }));

    res.json(buildPaginationResponse(formatted, page, pageSize, total));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /farms/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const farmId = Number(id);

  if (isNaN(farmId)) {
    return res.status(400).json({ error: "Invalid farm ID" });
  }

  try {
    const farm = await prisma.farm.findUnique({
      where: { id: farmId },
      include: {
        images: true,
        farmer: {
          select: { id: true, name: true, profileImageUrl: true },
        },
        farmProducts: {
          include: {
            product: {
              include: {
                images: true,
                reviews: {
                  include: { user: { select: { id: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!farm) {
      return res.status(404).json({ error: "Farm was not found" });
    }

    const formatted = {
      id: farm.id,
      name: farm.name,
      description: farm.description,
      city: farm.city,
      street: farm.street,
      region: farm.region,
      postalCode: farm.postalCode,
      country: farm.country,
      farmer: farm.farmer,
      images: farm.images,
      farmProducts: farm.farmProducts.map((fp) => ({
        id: fp.id,
        price: fp.price,
        stock: fp.stock,
        product: {
          id: fp.product.id,
          name: fp.product.name,
          category: fp.product.category,
          description: fp.product.description,
          rating: deriveRating(fp.product.rating),
          images: fp.product.images,
          reviews: fp.product.reviews,
        },
      })),
    };

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
