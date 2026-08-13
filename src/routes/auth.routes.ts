import { Router } from "express";
import { registry } from "../openapi.ts";
import rateLimit from "express-rate-limit";

import {
  register,
  login,
  refresh,
  logout,
  me,
} from "../controllers/auth.controller.ts";

import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../validators/auth.validator.ts";

import {
  validateBody,
} from "../middleware/validate.ts";

import { authenticate } from "../middleware/authenticate.ts";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later",
  },
});

router.use(authLimiter);

router.post(
  "/register",
  validateBody(registerSchema),
  register
);

router.post(
  "/login",
  validateBody(loginSchema),
  login
);

router.post(
  "/refresh",
  validateBody(refreshSchema),
  refresh
);

router.post(
  "/logout",
  authenticate,
  logout
);

router.get(
  "/me",
  authenticate,
  me
);

registry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: ["Auth"],
  summary: "Register a new user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User registered successfully",
    },
    409: {
      description: "Username or email already taken",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: ["Auth"],
  summary: "Login user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Login successful",
    },
    401: {
      description: "Invalid credentials",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: ["Auth"],
  summary: "Refresh access token",
  request: {
    body: {
      content: {
        "application/json": {
          schema: refreshSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "New token pair returned",
    },
    401: {
      description: "Invalid refresh token",
    },
  },
});

registry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: ["Auth"],
  summary: "Logout current user",
  security: [{ bearerAuth: [] }],
  responses: {
    204: {
      description: "Logged out successfully",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/auth/me",
  tags: ["Auth"],
  summary: "Get current user profile",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Current user profile",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

export default router;