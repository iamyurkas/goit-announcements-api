import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../prisma/client.ts";

import logger from "../logger.ts";

type TokenPayload = {
  sub: number;
  type: "access" | "refresh";
};

const createAccessToken = (userId: number) => {
  return jwt.sign(
    {
      sub: userId,
      type: "access",
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "15m",
    }
  );
};

const createRefreshToken = (userId: number) => {
  return jwt.sign(
    {
      sub: userId,
      type: "refresh",
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: "7d",
    }
  );
};

export const register = async (req: Request, res: Response) => {
  const { username, email, password, name } = req.body;

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email },
      ],
    },
  });

  if (existingUser) {
    return res.status(409).json({
      error: "Username or email already taken",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      name,
    },
  });

  logger.info(
    {
      userId: user.id,
      username: user.username,
    },
    "User registered"
  );

  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
    },
  });

  return res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  if (!user) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  logger.info(
    {
      userId: user.id,
      username: user.username,
    },
    "User logged in"
  );

  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({
      where: {
        userId: user.id,
      },
    }),

    prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
      },
    }),
  ]);

  return res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
    },
    accessToken,
    refreshToken,
  });
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  let payload: TokenPayload;

try {
  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_SECRET!
  );

  if (
    typeof decoded === "string" ||
    decoded.type !== "refresh" ||
    typeof decoded.sub !== "number"
  ) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  payload = {
    sub: decoded.sub,
    type: "refresh",
  };
} catch {
  return res.status(401).json({
    error: "Unauthorized",
  });
}

  const storedToken = await prisma.refreshToken.findUnique({
    where: {
      token: refreshToken,
    },
  });

  if (!storedToken) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  if (storedToken.userId !== payload.sub) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  const newAccessToken = createAccessToken(payload.sub);
  const newRefreshToken = createRefreshToken(payload.sub);

  await prisma.$transaction([
    prisma.refreshToken.delete({
      where: {
        token: refreshToken,
      },
    }),

    prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: payload.sub,
      },
    }),
  ]);

  return res.status(200).json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
};

export const logout = async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  await prisma.refreshToken.deleteMany({
    where: {
      userId,
    },
  });

  return res.status(204).end();
};

export const me = async (req: Request, res: Response) => {
  const userId = req.user!.sub;

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  return res.status(200).json(user);
};