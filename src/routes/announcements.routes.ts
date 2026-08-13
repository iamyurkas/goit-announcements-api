import { Router } from "express";
import { z } from "zod";

import { registry } from "../openapi.ts";

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
  title: z.string(),
  description: z.string(),
  price: z.coerce.number().positive(),
  category: z.string(),
  image: z
    .any()
    .openapi({
      type: "string",
      format: "binary",
    })
    .optional(),
});

const updateAnnouncementMultipartSchema =
  createAnnouncementMultipartSchema.partial();

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
    },
    404: {
      description: "Announcement not found",
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
    },
    401: {
      description: "Unauthorized",
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
    },
    403: {
      description: "Access denied",
    },
    404: {
      description: "Announcement not found",
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
    403: {
      description: "Access denied",
    },
    404: {
      description: "Announcement not found",
    },
  },
});

export default router;