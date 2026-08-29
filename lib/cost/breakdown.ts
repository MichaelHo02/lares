import { resolveLayout, type Placement } from "../domain/placement";
import {
  CATEGORY_LABELS,
  type Catalog,
  type ProductCategory,
} from "../domain/product";
import { formatAud, type Cents } from "../domain/units";

export interface CostLine {
  placementId: string;
  productId: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  priceCents: Cents;
  priceFormatted: string;
}

export interface CategorySubtotal {
  category: ProductCategory;
  categoryLabel: string;
  itemCount: number;
  subtotalCents: Cents;
  subtotalFormatted: string;
}

export interface CostBreakdown {
  lines: readonly CostLine[];
  byCategory: readonly CategorySubtotal[];
  itemCount: number;
  totalCents: Cents;
  totalFormatted: string;
  budgetCents: Cents | null;
  budgetFormatted: string | null;
  /** Positive when there is money left, negative when over budget. */
  remainingCents: Cents | null;
  remainingFormatted: string | null;
  overBudget: boolean;
}

export function buildCostBreakdown(
  placements: readonly Placement[],
  catalog: Catalog,
  budgetCents: Cents | null,
): CostBreakdown {
  const { resolved } = resolveLayout(placements, catalog);

  const lines: CostLine[] = resolved.map(({ placement, product }) => ({
    placementId: placement.id,
    productId: product.id,
    name: product.name,
    category: product.category,
    categoryLabel: CATEGORY_LABELS[product.category],
    priceCents: product.priceCents,
    priceFormatted: formatAud(product.priceCents),
  }));

  const totals = new Map<ProductCategory, { count: number; cents: Cents }>();
  for (const line of lines) {
    const current = totals.get(line.category) ?? { count: 0, cents: 0 };
    totals.set(line.category, {
      count: current.count + 1,
      cents: current.cents + line.priceCents,
    });
  }

  const byCategory: CategorySubtotal[] = [...totals.entries()]
    .map(([category, value]) => ({
      category,
      categoryLabel: CATEGORY_LABELS[category],
      itemCount: value.count,
      subtotalCents: value.cents,
      subtotalFormatted: formatAud(value.cents),
    }))
    .sort((a, b) => b.subtotalCents - a.subtotalCents);

  const totalCents = lines.reduce((sum, line) => sum + line.priceCents, 0);
  const remainingCents = budgetCents === null ? null : budgetCents - totalCents;

  return {
    lines,
    byCategory,
    itemCount: lines.length,
    totalCents,
    totalFormatted: formatAud(totalCents),
    budgetCents,
    budgetFormatted: budgetCents === null ? null : formatAud(budgetCents),
    remainingCents,
    remainingFormatted: remainingCents === null ? null : formatAud(remainingCents),
    overBudget: remainingCents !== null && remainingCents < 0,
  };
}
