import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  registry,
  authResponseSchema,
  tokenPairResponseSchema,
  userProfileResponseSchema,
  errorResponseSchema,
  validationErrorResponseSchema,
} from "../openapi.ts";

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
      content: {
        "application/json": {
          schema: authResponseSchema,
        },
      },
    },
    400: {
      description: "Validation failed",
      content: {
        "application/json": {
          schema: validationErrorResponseSchema,
        },
      },
    },
    409: {
      description: "Username or email already taken",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    429: {
      description: "Too many requests",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
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
      content: {
        "application/json": {
          schema: authResponseSchema,
        },
      },
    },
    400: {
      description: "Validation failed",
      content: {
        "application/json": {
          schema: validationErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Invalid credentials",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    429: {
      description: "Too many requests",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
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
      content: {
        "application/json": {
          schema: tokenPairResponseSchema,
        },
      },
    },
    400: {
      description: "Validation failed",
      content: {
        "application/json": {
          schema: validationErrorResponseSchema,
        },
      },
    },
    401: {
      description: "Invalid refresh token",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    429: {
      description: "Too many requests",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
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
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    429: {
      description: "Too many requests",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
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
      content: {
        "application/json": {
          schema: userProfileResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    429: {
      description: "Too many requests",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export default router;