import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: number;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    );

    if (
      typeof decoded === "string" ||
      decoded.type !== "access" ||
      typeof decoded.sub !== "number"
    ) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    req.user = {
      sub: decoded.sub,
    };

    next();
  } catch {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }
};