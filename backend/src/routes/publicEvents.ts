import { Router } from "express";
import prisma from "../prisma.ts";
import {
  buildPaginationResponse,
  getPaginationParams,
} from "../utils/pagination.ts";

const router = Router();

// GET /public-events
router.get("/", async (req, res) => {
  try {
    const now = new Date();
    const { page, pageSize, skip, take } = getPaginationParams(req.query);
    const where = {
      endDate: { gte: now },
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take,
        orderBy: {
          startDate: "asc",
        },
        include: {
          organizer: {
            select: {
              id: true,
              name: true,
              profileImageUrl: true,
            },
          },
          participants: {
            select: {
              user: {
                select: { id: true, name: true, profileImageUrl: true },
              },
            },
          },
          eventProducts: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  description: true,
                  basePrice: true,
                  images: true,
                },
              },
              user: {
                select: {
                  id: true,
                  name: true,
                  profileImageUrl: true,
                },
              },
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json(buildPaginationResponse(events, page, pageSize, total));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch public events." });
  }
});

// GET /public-events/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(Number(id))) {
      return res.status(400).json({ error: "Invalid event ID" });
    }

    const event = await prisma.event.findUnique({
      where: { id: Number(id) },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            profileImageUrl: true,
          },
        },
        participants: {
          select: {
            user: {
              select: { id: true, name: true, profileImageUrl: true },
            },
          },
        },
        eventProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
                description: true,
                basePrice: true,
                images: true,
              },
            },
            user: {
              select: {
                id: true,
                name: true,
                profileImageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch event details." });
  }
});

export default router;
