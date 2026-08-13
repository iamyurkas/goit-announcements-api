import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import fs from "fs/promises";

export const validateBody =
  (schema: ZodType) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Remove the file if body validation fails
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => undefined);
      }

      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
    }

    req.body = result.data;
    next();
  };

export const validateParams =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
    }

    req.params = result.data as typeof req.params;
    next();
  };

export const validateQuery =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten().fieldErrors,
      });
    }

    res.locals.validatedQuery = result.data;

    next();
  };