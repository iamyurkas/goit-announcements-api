import { Router } from "express";

import {
  register,
  login,
} from "../controllers/auth.controller.ts";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator.ts";

import {
  validateBody,
} from "../middleware/validate.ts";

const router = Router();

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

export default router;