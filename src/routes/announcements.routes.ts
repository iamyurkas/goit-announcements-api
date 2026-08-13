import { Router } from "express";
import { z } from "zod";

import {
  registry,
  announcementResponseSchema,
  announcementListResponseSchema,
  errorResponseSchema,
  validationErrorResponseSchema,
} from "../openapi.ts";

import {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcements.controller.ts";

import {
  announcementsQuerySchema,
  announcementIdSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from "../validators/announcements.validator.ts";

import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validate.ts";

import { authenticate } from "../middleware/authenticate.ts";
import upload from "../middleware/upload.ts";

const router = Router();

const createAnnouncementMultipartSchema = z.object({
  title: z
    .string()
    .min(5)
    .max(50),

  description: z
    .string()
    .min(10),

  price: z.coerce
    .number()
    .positive(),

  category: z.enum([
    "sale",
    "service",
    "job",
    "other",
  ]),

  image: z
    .any()
    .openapi({
      type: "string",
      format: "binary",
    })
    .optional(),
});

const updateAnnouncementMultipartSchema =
  createAnnouncementMultipartSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: "At least one field is required",
      }
    );

router.get(
  "/",
  validateQuery(announcementsQuerySchema),
  getAnnouncements
);

router.get(
  "/:id",
  validateParams(announcementIdSchema),
  getAnnouncementById
);

router.post(
  "/",
  authenticate,
  upload.single("image"),
  validateBody(createAnnouncementSchema),
  createAnnouncement
);

router.patch(
  "/:id",
  authenticate,
  validateParams(announcementIdSchema),
  upload.single("image"),
  validateBody(updateAnnouncementSchema),
  updateAnnouncement
);

router.delete(
  "/:id",
  authenticate,
  validateParams(announcementIdSchema),
  deleteAnnouncement
);

registry.registerPath({
  method: "get",
  path: "/announcements",
  tags: ["Announcements"],
  summary: "Get announcements",
  request: {
    query: announcementsQuerySchema,
  },
  responses: {
    200: {
      description: "List of announcements",
      content: {
        "application/json": {
          schema: announcementListResponseSchema,
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
  },
});

registry.registerPath({
  method: "get",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Get announcement by ID",
  request: {
    params: announcementIdSchema,
  },
  responses: {
    200: {
      description: "Announcement found",
      content: {
        "application/json": {
          schema: announcementResponseSchema,
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
    404: {
      description: "Announcement not found",
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
  path: "/announcements",
  tags: ["Announcements"],
  summary: "Create announcement",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: createAnnouncementMultipartSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Announcement created",
      content: {
        "application/json": {
          schema: announcementResponseSchema,
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
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Update announcement",
  security: [{ bearerAuth: [] }],
  request: {
    params: announcementIdSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: updateAnnouncementMultipartSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Announcement updated",
      content: {
        "application/json": {
          schema: announcementResponseSchema,
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
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Access denied",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Announcement not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/announcements/{id}",
  tags: ["Announcements"],
  summary: "Delete announcement",
  security: [{ bearerAuth: [] }],
  request: {
    params: announcementIdSchema,
  },
  responses: {
    204: {
      description: "Announcement deleted",
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
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: "Access denied",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: "Announcement not found",
      content: {
        "application/json": {
          schema: errorResponseSchema,
        },
      },
    },
  },
});

export default router;