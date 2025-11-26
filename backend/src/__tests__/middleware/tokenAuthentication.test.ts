import {
  authenticateToken,
  authorizeRole,
  AuthRequest,
} from "../../middleware/auth.ts";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");

describe("authenticateToken middleware", () => {
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

  it("should return 401 if token is missing", () => {
    const req = { cookies: {} } as AuthRequest;
    const res = mockResponse();

    authenticateToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Access token missing" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should return 403 if token is invalid", () => {
    const req = {
      cookies: { accessToken: "invalidToken" },
    } as Partial<AuthRequest> as AuthRequest;
    const res = mockResponse();
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    authenticateToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid or expired token",
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next() if token is valid", () => {
    const req = {
      cookies: { accessToken: "validToken" },
    } as Partial<AuthRequest> as AuthRequest;
    const res = mockResponse();
    const decodedUser = { id: 1, role: "FARMER" };
    (jwt.verify as jest.Mock).mockReturnValue(decodedUser);

    authenticateToken(req, res, mockNext);

    expect((req as any).user).toEqual(decodedUser);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe("authorizeRole middleware", () => {
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

  it("should deny access if user role does not match", () => {
    const req: any = { user: { role: "CUSTOMER" } };
    const res = mockResponse();

    const middleware = authorizeRole("FARMER");
    middleware(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Access denied" });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should call next() if user role matches", () => {
    const req: any = { user: { role: "FARMER" } };
    const res = mockResponse();

    const middleware = authorizeRole("FARMER");
    middleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
