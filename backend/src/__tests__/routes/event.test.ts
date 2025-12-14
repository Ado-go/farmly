process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ?? "access-secret";

import request from "supertest";
import app from "../../index.ts";
import prisma from "../../prisma.ts";
import jwt from "jsonwebtoken";

describe("Event Routes", () => {
  let FARMER_ID: number;
  let OTHER_FARMER_ID: number;
  let accessToken: string;
  let otherAccessToken: string;
  let eventId: number;
  const baseAddress = {
    address: "Main Street 1",
    postalCode: "01001",
    city: "Bratislava",
    country: "Slovakia",
  };

  beforeAll(async () => {
    const farmer = await prisma.user.create({
      data: {
        email: "farmer@test.com",
        password: "hashedpassword",
        name: "Farmer",
        phone: "+421900000001",
        role: "FARMER",
        ...baseAddress,
      },
    });
    FARMER_ID = farmer.id;
    accessToken = jwt.sign(
      { id: FARMER_ID, role: "FARMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );

    const otherFarmer = await prisma.user.create({
      data: {
        email: "otherfarmer@test.com",
        password: "hashedpassword",
        name: "Other Farmer",
        phone: "+421900000002",
        role: "FARMER",
        ...baseAddress,
      },
    });
    OTHER_FARMER_ID = otherFarmer.id;
    otherAccessToken = jwt.sign(
      { id: OTHER_FARMER_ID, role: "FARMER" },
      process.env.ACCESS_TOKEN_SECRET!
    );
  });

  afterAll(async () => {
    await prisma.eventParticipant.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  it("POST /event - should create a new event", async () => {
    const res = await request(app)
      .post("/api/event")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        title: "Farm Festival",
        description: "Annual farm gathering",
        startDate: "2025-12-01T10:00:00.000Z",
        endDate: "2025-12-02T18:00:00.000Z",
        city: "Bratislava",
        street: "Main Street 1",
        region: "Bratislavský",
        postalCode: "81101",
        country: "Slovakia",
        stallName: "Farmer Stall",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("Farm Festival");
    eventId = res.body.id;
  });

  it("POST /event - should fail when creating more than 5 events", async () => {
    for (let i = 0; i < 5; i++) {
      await prisma.event.create({
        data: {
          title: `Event ${i}`,
          startDate: new Date(),
          endDate: new Date(),
          city: "Brno",
          street: "Street 1",
          region: "Region",
          postalCode: "10000",
          country: "Czech Republic",
          organizerId: FARMER_ID,
        },
      });
    }

    const res = await request(app)
      .post("/api/event")
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        title: "Too many events",
        startDate: "2025-12-03T10:00:00.000Z",
        endDate: "2025-12-04T18:00:00.000Z",
        city: "Praha",
        street: "Street 2",
        region: "Praha",
        postalCode: "11000",
        country: "Czech Republic",
        stallName: "Farmer Stall",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("GET /event - should return all events with participants and organizer", async () => {
    const res = await request(app)
      .get("/api/event")
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty("organizer");
    expect(res.body[0]).toHaveProperty("participants");
  });

  it("GET /event/:id - should return a single event with participants", async () => {
    const res = await request(app)
      .get(`/api/event/${eventId}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("title");
    expect(res.body).toHaveProperty("participants");
  });

  it("PUT /event/:id - should update own event (full data required)", async () => {
    const res = await request(app)
      .put(`/api/event/${eventId}`)
      .set("Cookie", [`accessToken=${accessToken}`])
      .send({
        title: "Updated Festival",
        description: "Updated farm event",
        startDate: "2025-12-05T09:00:00.000Z",
        endDate: "2025-12-06T18:00:00.000Z",
        city: "Trnava",
        street: "Updated Street 10",
        region: "Trnavský",
        postalCode: "91701",
        country: "Slovakia",
        stallName: "Updated Stall",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("title", "Updated Festival");
    expect(res.body).toHaveProperty("city", "Trnava");
  });

  it("PUT /event/:id - should fail to update other farmer's event (full data required)", async () => {
    const res = await request(app)
      .put(`/api/event/${eventId}`)
      .set("Cookie", [`accessToken=${otherAccessToken}`])
      .send({
        title: "Invalid Update",
        description: "Unauthorized farmer update attempt",
        startDate: "2025-12-10T08:00:00.000Z",
        endDate: "2025-12-11T18:00:00.000Z",
        city: "Košice",
        street: "Street 99",
        region: "Košický",
        postalCode: "04001",
        country: "Slovakia",
        stallName: "Unauthorized Stall",
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Event not found or unauthorized"
    );
  });

  it("POST /event/:id/join - should allow farmer to join event", async () => {
    const res = await request(app)
      .post(`/api/event/${eventId}/join`)
      .set("Cookie", [`accessToken=${otherAccessToken}`])
      .send({ stallName: "Other Farmer Stall" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "You have successfully joined the event"
    );

    const participant = await prisma.eventParticipant.findFirst({
      where: { eventId, userId: OTHER_FARMER_ID },
    });
    expect(participant).not.toBeNull();
  });

  it("POST /event/:id/join - should fail when already joined", async () => {
    const res = await request(app)
      .post(`/api/event/${eventId}/join`)
      .set("Cookie", [`accessToken=${otherAccessToken}`])
      .send({ stallName: "Other Farmer Stall" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty(
      "message",
      "You have already joined this event"
    );
  });

  it("DELETE /event/:id/leave - should allow farmer to leave event", async () => {
    const res = await request(app)
      .delete(`/api/event/${eventId}/leave`)
      .set("Cookie", [`accessToken=${otherAccessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "You have successfully left the event"
    );

    const participant = await prisma.eventParticipant.findFirst({
      where: { eventId, userId: OTHER_FARMER_ID },
    });
    expect(participant).toBeNull();
  });

  it("DELETE /event/:id/leave - should fail if user not joined", async () => {
    const res = await request(app)
      .delete(`/api/event/${eventId}/leave`)
      .set("Cookie", [`accessToken=${otherAccessToken}`]);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "You are not a participant of this event"
    );
  });

  it("DELETE /event/:id - should delete own event", async () => {
    const newEvent = await prisma.event.create({
      data: {
        title: "Delete Event",
        description: "Temporary event for delete test",
        startDate: new Date(),
        endDate: new Date(),
        city: "Nitra",
        street: "Street 3",
        region: "Nitriansky",
        postalCode: "94901",
        country: "Slovakia",
        organizerId: FARMER_ID,
      },
    });

    const res = await request(app)
      .delete(`/api/event/${newEvent.id}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      "Event was successfully deleted"
    );
  });

  it("DELETE /event/:id - should fail to delete other farmer's event", async () => {
    const otherEvent = await prisma.event.create({
      data: {
        title: "Other Event",
        description: "Another test event",
        startDate: new Date(),
        endDate: new Date(),
        city: "Košice",
        street: "Street 4",
        region: "Košický",
        postalCode: "04001",
        country: "Slovakia",
        organizerId: OTHER_FARMER_ID,
      },
    });

    const res = await request(app)
      .delete(`/api/event/${otherEvent.id}`)
      .set("Cookie", [`accessToken=${accessToken}`]);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty(
      "message",
      "Event not found or unauthorized"
    );
  });

  it("GET /event/:id - should return 401 without token", async () => {
    const res = await request(app).get(`/api/event/${eventId}`);
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("message", "Access token missing");
  });
});
