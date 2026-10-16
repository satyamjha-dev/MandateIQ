import merchantReference from "@/data/merchant-reference.json";
import type { MerchantReferenceItem } from "@/types/transaction";

export type MerchantIdentificationResult = {
  canonicalName: string;
  category?: string;
  matchedAlias: string;
  confidence: "EXACT" | "ALIAS" | "CONSERVATIVE_MATCH";
} | null;

// Normalize tokens for matching: remove non-alphanumeric except spaces, uppercase
function normalizeForMatching(text: string): string {
  return text
    .toUpperCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Pre-index aliases and tokens for fast, deterministic matching
const indexedMerchants: Array<{
  canonicalName: string;
  category: string;
  exactAliases: Set<string>;
  aliasTokens: Array<{ rawAlias: string; normalizedAlias: string }>;
}> = (merchantReference as MerchantReferenceItem[]).map((m) => ({
  canonicalName: m.canonicalName,
  category: m.category,
  exactAliases: new Set(
    [m.canonicalName, ...m.aliases].map((a) => normalizeForMatching(a))
  ),
  aliasTokens: [m.canonicalName, ...m.aliases].map((a) => ({
    rawAlias: a,
    normalizedAlias: normalizeForMatching(a),
  })),
}));

/**
 * Deterministically identifies a merchant from a transaction description.
 *
 * Steps:
 * 1. Normalize description into comparable tokens.
 * 2. Check for exact alias match.
 * 3. Check for boundary-bounded keyword / alias match within the description.
 * 4. If no clear match is found, returns null (unknown stays unknown).
 */
export function identifyMerchant(
  rawDescription: string,
  normalizedDescription?: string
): MerchantIdentificationResult {
  const textToAnalyze = normalizedDescription || rawDescription;
  if (!textToAnalyze || !textToAnalyze.trim()) {
    return null;
  }

  const cleanInput = normalizeForMatching(textToAnalyze);

  // 1. Direct exact match against any known alias
  for (const merchant of indexedMerchants) {
    if (merchant.exactAliases.has(cleanInput)) {
      return {
        canonicalName: merchant.canonicalName,
        category: merchant.category,
        matchedAlias: cleanInput,
        confidence: "EXACT",
      };
    }
  }

  // 2. Word-boundary or token match
  // e.g., "UPI/DR/123/NETFLIX ENTERTAINMENT/..." contains "NETFLIX"
  for (const merchant of indexedMerchants) {
    for (const { rawAlias, normalizedAlias } of merchant.aliasTokens) {
      if (normalizedAlias.length < 3) continue; // avoid 1-2 char false positives

      // Ensure whole word boundary matching
      const regex = new RegExp(`(^|\\b|\\s)${escapeRegExp(normalizedAlias)}(\\b|\\s|$)`, "i");
      if (regex.test(cleanInput)) {
        return {
          canonicalName: merchant.canonicalName,
          category: merchant.category,
          matchedAlias: rawAlias,
          confidence: "CONSERVATIVE_MATCH",
        };
      }
    }
  }

  // 3. Not found -> Unknown merchant must remain unknown
  return null;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export { indexedMerchants };

