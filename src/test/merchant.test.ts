import { describe, it, expect } from "vitest";
import { identifyMerchant } from "@/lib/merchants/identify";

describe("Merchant Identification", () => {
  it("matches exact alias for Netflix", () => {
    const match = identifyMerchant("NETFLIX.COM");
    expect(match).not.toBeNull();
    expect(match?.canonicalName).toBe("Netflix");
    expect(match?.category).toBe("Entertainment & Streaming");
  });

  it("matches Spotify alias with suffix", () => {
    const match = identifyMerchant("SPOTIFY INDIA");
    expect(match).not.toBeNull();
    expect(match?.canonicalName).toBe("Spotify");
  });

  it("matches Amazon within UPI bank narration", () => {
    const match = identifyMerchant("UPI/DR/123456/AMAZON PAY INDIA/BARB/order99");
    expect(match).not.toBeNull();
    expect(match?.canonicalName).toBe("Amazon");
  });

  it("matches Google services", () => {
    const match = identifyMerchant("GOOGLE STORAGE 100GB");
    expect(match).not.toBeNull();
    expect(match?.canonicalName).toBe("Google");
  });

  it("matches Microsoft subscription", () => {
    const match = identifyMerchant("MICROSOFT 365 FAMILY");
    expect(match).not.toBeNull();
    expect(match?.canonicalName).toBe("Microsoft");
  });

  it("matches Zomato and Swiggy food orders", () => {
    const zomatoMatch = identifyMerchant("ZOMATO RESTAURANT GURGAON");
    expect(zomatoMatch?.canonicalName).toBe("Zomato");

    const swiggyMatch = identifyMerchant("SWIGGY INSTAMART ORDER");
    expect(swiggyMatch?.canonicalName).toBe("Swiggy");
  });

  it("keeps unknown merchant as null without guessing", () => {
    const match = identifyMerchant("PAID TO SHARMA GENERAL STORE");
    expect(match).toBeNull();
  });

  it("returns null for empty or whitespace-only descriptions", () => {
    expect(identifyMerchant("")).toBeNull();
    expect(identifyMerchant("   ")).toBeNull();
  });
});

