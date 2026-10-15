import { describe, it, expect } from "vitest";
import { z } from "zod";
import Papa from "papaparse";

describe("Development Environment Tooling Verification", () => {
  it("verifies Vitest test runner is functional", () => {
    expect(true).toBe(true);
  });

  it("verifies Zod schema validation library is functional", () => {
    const envSchema = z.object({
      name: z.string(),
      status: z.enum(["active", "pending"]),
    });

    const parsed = envSchema.parse({ name: "MandateIQ", status: "active" });
    expect(parsed.name).toBe("MandateIQ");
    expect(parsed.status).toBe("active");
  });

  it("verifies Papa Parse CSV parser is functional", () => {
    const csvContent = "date,description,amount\n2025-01-01,Subscription,15.99";
    const result = Papa.parse(csvContent, { header: true });

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({
      date: "2025-01-01",
      description: "Subscription",
      amount: "15.99",
    });
  });
});

