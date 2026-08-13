import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(50, "Title must be at most 50 characters"),

  description: z
    .string()
    .min(10, "Description must be at least 10 characters"),

  price: z
    .coerce
    .number()
    .positive("Price must be greater than 0"),

  category: z.enum([
    "sale",
    "service",
    "job",
    "other",
  ]),
});

export const updateAnnouncementSchema =
  createAnnouncementSchema
    .partial()
    .refine(
      (data) => Object.keys(data).length > 0,
      {
        message: "At least one field is required",
      }
    );

export const announcementIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const announcementsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  search: z.string().optional().default(""),
  sort: z.enum(["newest", "oldest"]).optional().default("newest"),
});