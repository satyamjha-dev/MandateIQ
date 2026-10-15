import { describe, it, expect } from "vitest";
import { prisma } from "../lib/db";

describe("PostgreSQL & Prisma 7 Database Connection", () => {
  it("successfully connects to the PostgreSQL container and executes a query", async () => {
    // Execute a raw query to verify the driver adapter and connection
    const result = await prisma.$queryRaw<Array<{ connected: number }>>`SELECT 1 as connected`;
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(Number(result[0].connected)).toBe(1);
  });
});

