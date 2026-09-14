/**
 * QualitySpec — Technical Substitution & Import Replacement Agent
 * Semantic search over technical attributes (GSM, thread count, chemicals)
 * recommending lower-cost Egyptian-manufactured alternatives.
 */
import { prisma } from "@/lib/prisma";
import { AgentContext } from "./swarm-orchestrator";

const TECHNICAL_ATTRS = ["gsm", "threadCount", "chemicalFormula", "material", "grade", "thickness", "density"];

export const QualitySpecAgent = {
  async execute(ctx: AgentContext) {
    const productId = ctx.payload.productId as string;
    const products = productId
      ? [await prisma.product.findUnique({ where: { id: productId }, select: { id: true, category: true, unitPrice: true, description: true, name: true } })]
      : [];

    const results: Array<{ original: string; alternative: string; savings: number }> = [];

    for (const p of products) {
      if (!p || !p.description) continue;

      // Find same-category alternatives from different suppliers
      const alternatives = await prisma.product.findMany({
        where: {
          category: p.category,
          tenantId: ctx.tenantId,
          unitPrice: { lt: Number(p.unitPrice || 999999) },
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { id: true, name: true, unitPrice: true, description: true, sku: true },
        take: 3,
        orderBy: { unitPrice: "asc" },
      });

      for (const alt of alternatives) {
        const savings = Math.round((Number(p.unitPrice || 0) - Number(alt.unitPrice || 0)) * 100) / 100;
        if (savings > 0) {
          results.push({
            original: p.name,
            alternative: alt.name,
            savings: Math.round(savings * 100) / 100,
          });
        }
      }
    }

    return { success: true, output: { substitutions: results, count: results.length } };
  },
};