import type { Request, Response } from "express";
import prisma from "../../prisma/client.ts";

const userSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
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

  const announcement = await prisma.announcement.create({
    data: {
      title,
      description,
      price,
      category,
      userId,
    },
    include: {
      user: {
        select: userSelect,
      },
    },
  });

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
    return res.status(404).json({
      error: "Announcement not found",
    });
  }

  if (announcement.userId !== userId) {
    return res.status(403).json({
      error: "Access denied",
    });
  }

  const updatedAnnouncement = await prisma.announcement.update({
    where: {
      id,
    },
    data: req.body,
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