import { describe, expect, it } from "vitest";
import bcrypt from "bcrypt";

import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../src/validators/auth.validator.ts";

describe("Auth validation", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    });

    expect(result.success).toBe(true);
  });

  it("rejects login without a password", () => {
    const result = loginSchema.safeParse({
      username: "testuser",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid refresh token", () => {
    const result = refreshSchema.safeParse({
      refreshToken: "some-refresh-token",
    });

    expect(result.success).toBe(true);
  });
});

describe("Password hashing", () => {
  it("hashes a password and verifies it correctly", async () => {
    const password = "password123";

    const hash = await bcrypt.hash(password, 10);

    expect(hash).not.toBe(password);

    const matches = await bcrypt.compare(password, hash);

    expect(matches).toBe(true);
  });
});