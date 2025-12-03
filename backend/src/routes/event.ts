import { Router } from "express";
import prisma from "../prisma.ts";
import type { Prisma } from "@prisma/client";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import { eventSchema } from "../schemas/eventSchemas.ts";
import { v2 as cloudinary } from "cloudinary";

const router = Router();

// POST /event
router.post(
  "/",
  authenticateToken,
  authorizeRole("FARMER"),
  validateRequest(eventSchema),
  async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      // max 5 events
      const eventCount = await prisma.event.count({
        where: { organizerId: userId },
      });

      if (eventCount >= 5) {
        return res
          .status(400)
          .json({ message: "You can create a maximum of 5 events." });
      }

      const { images = [], ...eventData } = req.body as {
        images?: { url: string; publicId: string }[];
      } & Omit<Prisma.EventCreateInput, "organizer" | "images">;

      const createData: Prisma.EventCreateInput = {
        ...eventData,
        organizer: { connect: { id: userId } },
        images: {
          create: images.map((img) => ({
            url: img.url,
            publicId: img.publicId,
          })),
        },
      };

      const event = await prisma.event.create({
        data: createData,
        include: { images: true },
      });

      await prisma.eventParticipant.create({
        data: {
          eventId: event.id,
          userId: userId!,
        },
      });

      res.status(201).json(event);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to create event" });
    }
  }
);

// GET /event
router.get(
  "/",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const events = await prisma.event.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          city: true,
          street: true,
          region: true,
          postalCode: true,
          country: true,
          createdAt: true,
          images: true,

          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profileImageUrl: true,
            },
          },

          participants: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  profileImageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { startDate: "asc" },
      });

      const formatted = events.map((event) => ({
        ...event,
        participants: event.participants.map((p) => p.user),
      }));

      res.json(formatted);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to load events" });
    }
  }
);

// GET /event/:id
router.get(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);

      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: {
          id: true,
          title: true,
          description: true,
          startDate: true,
          endDate: true,
          city: true,
          street: true,
          region: true,
          postalCode: true,
          country: true,
          createdAt: true,
          images: true,

          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              profileImageUrl: true,
            },
          },

          participants: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
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

      const formattedEvent = {
        ...event,
        participants: event.participants.map((p) => p.user),
      };

      res.json(formattedEvent);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error while loading event" });
    }
  }
);

// PUT /event/:id
router.put(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  validateRequest(eventSchema),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const eventId = parseInt(req.params.id, 10);

      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const existingEvent = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizerId: userId,
        },
        include: { images: true },
      });

      if (!existingEvent) {
        return res
          .status(404)
          .json({ message: "Event not found or unauthorized" });
      }

      const { images = [], ...data } = req.body as {
        images?: { url: string; publicId: string }[];
        [k: string]: any;
      };

      const existingPublicIds = existingEvent.images.map((i) => i.publicId);
      const newPublicIds = (images || [])
        .map((i) => i.publicId)
        .filter(Boolean);

      const toDelete = existingPublicIds.filter(
        (pid) => !newPublicIds.includes(pid)
      );

      await prisma.$transaction(async (tx) => {
        if (toDelete.length > 0) {
          await Promise.all(
            toDelete.map(async (pid) => {
              try {
                await cloudinary.uploader.destroy(pid, {
                  resource_type: "image",
                });
              } catch (e) {
                console.error("Failed to delete Cloudinary image:", pid, e);
              }
            })
          );

          await tx.eventImage.deleteMany({
            where: { eventId, publicId: { in: toDelete } },
          });
        }

        const newImages = (images || []).filter(
          (img) => !existingPublicIds.includes(img.publicId)
        );

        if (newImages.length > 0) {
          await tx.eventImage.createMany({
            data: newImages.map((img) => ({
              url: img.url,
              publicId: img.publicId,
              eventId,
            })),
          });
        }

        await tx.event.update({
          where: { id: eventId },
          data,
        });
      });

      const updatedEvent = await prisma.event.findUnique({
        where: { id: eventId },
        include: { images: true },
      });

      res.json(updatedEvent);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to update event" });
    }
  }
);

// DELETE /event/:id
router.delete(
  "/:id",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const eventId = parseInt(req.params.id, 10);

      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const existingEvent = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizerId: userId,
        },
        include: { images: true },
      });

      if (!existingEvent) {
        return res
          .status(404)
          .json({ message: "Event not found or unauthorized" });
      }

      const publicIds = (existingEvent.images || []).map((i) => i.publicId);

      await prisma.$transaction(async (tx) => {
        if (publicIds.length > 0) {
          await Promise.all(
            publicIds.map(async (pid) => {
              try {
                await cloudinary.uploader.destroy(pid, {
                  resource_type: "image",
                });
              } catch (e) {
                console.error("Failed to delete Cloudinary image:", pid, e);
              }
            })
          );

          await tx.eventImage.deleteMany({
            where: { eventId, publicId: { in: publicIds } },
          });
        }

        await tx.event.delete({
          where: { id: eventId },
        });
      });

      res.json({ message: "Event was successfully deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to delete event" });
    }
  }
);

// POST /event/:id/join — JOIN event
router.post(
  "/:id/join",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const eventId = parseInt(req.params.id, 10);

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const event = await prisma.event.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const existingParticipant = await prisma.eventParticipant.findFirst({
        where: { eventId, userId },
      });

      if (existingParticipant) {
        return res
          .status(400)
          .json({ message: "You have already joined this event" });
      }

      await prisma.eventParticipant.create({
        data: {
          eventId,
          userId,
        },
      });

      res.json({ message: "You have successfully joined the event" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to join event" });
    }
  }
);

// DELETE /event/:id/leave — LEAVE event
router.delete(
  "/:id/leave",
  authenticateToken,
  authorizeRole("FARMER"),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      const eventId = parseInt(req.params.id, 10);

      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }

      const participant = await prisma.eventParticipant.findFirst({
        where: { eventId, userId },
      });

      if (!participant) {
        return res
          .status(404)
          .json({ message: "You are not a participant of this event" });
      }

      await prisma.eventParticipant.delete({
        where: { id: participant.id },
      });

      res.json({ message: "You have successfully left the event" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Unable to leave event" });
    }
  }
);

export default router;
