import { validateRequest } from "../../middleware/validateRequest";
import { z } from "zod";

describe("validateRequest middleware", () => {
  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  it("should call next() if request body is valid", () => {
    const req: any = {
      body: {
        email: "test@example.com",
        password: "secret123",
      },
    };
    const res = mockResponse();

    const middleware = validateRequest(schema);
    middleware(req, res, mockNext);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
  });

  it("should return 400 and validation errors if body is invalid", () => {
    const req: any = {
      body: {
        email: "not-an-email",
        password: "123",
      },
    };
    const res = mockResponse();

    const middleware = validateRequest(schema);
    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Invalid request data",
        details: expect.arrayContaining([
          expect.objectContaining({
            path: "email",
            message: expect.any(String),
          }),
          expect.objectContaining({
            path: "password",
            message: expect.any(String),
          }),
        ]),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should include multiple errors if multiple fields are invalid", () => {
    const req: any = { body: {} };
    const res = mockResponse();

    const middleware = validateRequest(schema);
    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.arrayContaining([
          expect.objectContaining({ path: "email" }),
          expect.objectContaining({ path: "password" }),
        ]),
      })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });
});
