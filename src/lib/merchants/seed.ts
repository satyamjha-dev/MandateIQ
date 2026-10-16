import { prisma } from "@/lib/db";
import merchantReference from "@/data/merchant-reference.json";
import type { MerchantReferenceItem } from "@/types/transaction";

/**
 * Ensures the curated merchant reference data exists in the PostgreSQL database.
 * Uses an upsert strategy to preserve existing entries without overwriting custom edits.
 */
export async function seedMerchants(): Promise<void> {
  const merchants = merchantReference as MerchantReferenceItem[];

  for (const item of merchants) {
    const merchant = await prisma.merchant.upsert({
      where: { canonicalName: item.canonicalName },
      update: { category: item.category },
      create: {
        canonicalName: item.canonicalName,
        category: item.category,
      },
    });

    for (const alias of item.aliases) {
      await prisma.merchantAlias.upsert({
        where: { alias },
        update: {},
        create: {
          merchantId: merchant.id,
          alias,
        },
      });
    }
  }
}

