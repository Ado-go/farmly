import { Router } from "express";
import prisma from "../prisma.ts";
import { authenticateToken, authorizeRole } from "../middleware/auth.ts";
import { validateRequest } from "../middleware/validateRequest.ts";
import { eventSchema } from "../schemas/eventSchemas.ts";

const router = Router();

// POST /event
router.post(
  "/",
  authenticateToken,
  authorizeRole("FARMER"),
  validateRequest(eventSchema),
  async (req, res) => {
    const userId = req.user?.id;

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

      const event = await prisma.event.create({
        data: {
          ...req.body,
          organizerId: userId,
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

          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
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

          organizer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
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
      });

      if (!existingEvent) {
        return res
          .status(404)
          .json({ message: "Event not found or unauthorized" });
      }

      const updatedEvent = await prisma.event.update({
        where: { id: eventId },
        data: req.body,
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
      });

      if (!existingEvent) {
        return res
          .status(404)
          .json({ message: "Event not found or unauthorized" });
      }

      await prisma.event.delete({
        where: { id: eventId },
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
