import type { Request, Response } from "express";
import fs from "fs/promises";

import prisma from "../../prisma/client.ts";
import logger from "../logger.ts";
import cloudinary from "../cloudinary.ts";

const userSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
};

const uploadImageToCloudinary = async (filePath: string) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "announcements",
  });

  return result.secure_url;
};

export const getAnnouncements = async (
  req: Request,
  res: Response
) => {
  const {
    page = 1,
    search = "",
    sort = "newest",
  } = res.locals.validatedQuery as {
    page?: number;
    search?: string;
    sort?: "newest" | "oldest";
  };

  const perPage = 10;

  const where = search
    ? {
        title: {
          contains: search,
          mode: "insensitive" as const,
        },
      }
    : {};

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : { createdAt: "desc" as const };

  const skip = (page - 1) * perPage;

  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      orderBy,
      skip,
      take: perPage,
      include: {
        user: {
          select: userSelect,
        },
      },
    }),
    prisma.announcement.count({
      where,
    }),
  ]);

  return res.status(200).json({
    data: announcements,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / perPage),
      perPage,
    },
  });
};

export const getAnnouncementById = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);

  const announcement = await prisma.announcement.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  if (!announcement) {
    return res.status(404).json({
      error: "Announcement not found",
    });
  }

  return res.status(200).json(announcement);
};

export const createAnnouncement = async (
  req: Request,
  res: Response
) => {
  const userId = req.user!.sub;

  const { title, description, price, category } = req.body;

  let imageUrl: string | undefined;

  if (req.file) {
    try {
      imageUrl = await uploadImageToCloudinary(req.file.path);

      logger.info(
        {
          userId,
          imageUrl,
        },
        "Announcement photo uploaded"
      );
    } finally {
      await fs.unlink(req.file.path).catch(() => undefined);
    }
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      description,
      price,
      category,
      imageUrl,
      userId,
    },
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  logger.info(
    {
      announcementId: announcement.id,
      userId,
    },
    "Announcement created"
  );

  return res.status(201).json(announcement);
};

export const updateAnnouncement = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);
  const userId = req.user!.sub;

  const announcement = await prisma.announcement.findUnique({
    where: {
      id,
    },
  });

  if (!announcement) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => undefined);
    }

    return res.status(404).json({
      error: "Announcement not found",
    });
  }

  if (announcement.userId !== userId) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => undefined);
    }

    return res.status(403).json({
      error: "Access denied",
    });
  }

  let imageUrl: string | undefined;

  if (req.file) {
    try {
      imageUrl = await uploadImageToCloudinary(req.file.path);

      logger.info(
        {
          announcementId: id,
          userId,
          imageUrl,
        },
        "Announcement photo uploaded"
      );
    } finally {
      await fs.unlink(req.file.path).catch(() => undefined);
    }
  }

  const updatedAnnouncement = await prisma.announcement.update({
    where: {
      id,
    },
    data: {
      ...req.body,
      ...(imageUrl ? { imageUrl } : {}),
    },
    include: {
      user: {
        select: userSelect,
      },
    },
  });

  return res.status(200).json(updatedAnnouncement);
};

export const deleteAnnouncement = async (
  req: Request,
  res: Response
) => {
  const id = Number(req.params.id);
  const userId = req.user!.sub;

  const announcement = await prisma.announcement.findUnique({
    where: {
      id,
    },
  });

  if (!announcement) {
    return res.status(404).json({
      error: "Announcement not found",
    });
  }

  if (announcement.userId !== userId) {
    return res.status(403).json({
      error: "Access denied",
    });
  }

  await prisma.announcement.delete({
    where: {
      id,
    },
  });

  return res.status(204).end();
};