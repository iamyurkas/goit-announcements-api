import {
  extendZodWithOpenApi,
  OpenApiGeneratorV3,
  OpenAPIRegistry,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
});

export const userResponseSchema = registry.register(
  "UserResponse",
  z.object({
    id: z.number().int(),
    username: z.string(),
    email: z.string().email(),
    name: z.string(),
  })
);

export const userProfileResponseSchema = registry.register(
  "UserProfileResponse",
  userResponseSchema.extend({
    createdAt: z.string().datetime(),
  })
);

export const authResponseSchema = registry.register(
  "AuthResponse",
  z.object({
    user: userResponseSchema,
    accessToken: z.string(),
    refreshToken: z.string(),
  })
);

export const tokenPairResponseSchema = registry.register(
  "TokenPairResponse",
  z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  })
);

export const errorResponseSchema = registry.register(
  "ErrorResponse",
  z.object({
    error: z.string(),
  })
);

export const validationErrorResponseSchema = registry.register(
  "ValidationErrorResponse",
  z.object({
    error: z.literal("Validation failed"),
    details: z.record(
      z.string(),
      z.array(z.string())
    ),
  })
);

export const announcementResponseSchema = registry.register(
  "AnnouncementResponse",
  z.object({
    id: z.number().int(),
    title: z.string(),
    description: z.string(),
    price: z.number(),
    category: z.enum([
      "sale",
      "service",
      "job",
      "other",
    ]),
    imageUrl: z.string().url().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    user: userResponseSchema,
  })
);

export const announcementListResponseSchema = registry.register(
  "AnnouncementListResponse",
  z.object({
    data: z.array(announcementResponseSchema),
    pagination: z.object({
      total: z.number().int(),
      page: z.number().int(),
      totalPages: z.number().int(),
      perPage: z.number().int(),
    }),
  })
);

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "Announcements API",
      version: "1.0.0",
      description: "REST API for user authentication and managing classified announcements.",
    },
    servers: [{ url: "http://localhost:3000" }],
  });
}