import request from "supertest";
import app from "../../index";

describe("Auth API", () => {
  it("should return 400 if email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ password: "test123", role: "CUSTOMER" });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty(
      "error",
      "Missing email or password or role"
    );
  });
});
