import {
  smallestCrossSection,
  type Catalog,
  type Product,
  type ProductCategory,
  type StyleTag,
} from "../domain/product";
import type { Cents, Mm } from "../domain/units";

export interface CatalogQuery {
  /** Free-text match against name and blurb. */
  text?: string;
  categories?: readonly ProductCategory[];
  /** Longest footprint side the item may have, in either orientation. */
  maxWidthMm?: Mm;
  /** Shortest footprint side the item may have, in either orientation. */
  maxDepthMm?: Mm;
  minWidthMm?: Mm;
  maxHeightMm?: Mm;
  maxPriceCents?: Cents;
  minPriceCents?: Cents;
  styleTags?: readonly StyleTag[];
  /** Match every listed tag rather than any of them. */
  requireAllStyleTags?: boolean;
  /**
   * When set, the item's footprint plus its declared clearance depths must fit
   * within `maxWidthMm` × `maxDepthMm`, not just its bare footprint.
   */
  includeClearances?: boolean;
  /** Narrowest doorway the item has to be carried through. */
  mustFitThroughMm?: Mm;
  limit?: number;
}

export interface FootprintEnvelope {
  widthMm: Mm;
  depthMm: Mm;
}

/**
 * Footprint plus clearance zones. Clearances on opposite faces both add to the
 * same axis, which is why a wardrobe needs far more depth than its 600mm carcass.
 */
export function clearanceEnvelope(product: Product): FootprintEnvelope {
  let extraWidth = 0;
  let extraDepth = 0;
  for (const requirement of product.clearances) {
    switch (requirement.face) {
      case "front":
      case "back":
        extraDepth += requirement.depthMm;
        break;
      case "left":
      case "right":
        extraWidth += requirement.depthMm;
        break;
      default: {
        const exhaustive: never = requirement.face;
        throw new Error(`unhandled face: ${String(exhaustive)}`);
      }
    }
  }
  return {
    widthMm: product.widthMm + extraWidth,
    depthMm: product.depthMm + extraDepth,
  };
}

/** A rectangle fits a bounding box if either orientation fits. */
function fitsEitherWay(
  envelope: FootprintEnvelope,
  maxWidthMm: Mm | undefined,
  maxDepthMm: Mm | undefined,
): boolean {
  if (maxWidthMm === undefined && maxDepthMm === undefined) return true;
  const boundA = maxWidthMm ?? Number.POSITIVE_INFINITY;
  const boundB = maxDepthMm ?? Number.POSITIVE_INFINITY;
  const upright = envelope.widthMm <= boundA && envelope.depthMm <= boundB;
  const turned = envelope.depthMm <= boundA && envelope.widthMm <= boundB;
  return upright || turned;
}

function matchesText(product: Product, text: string): boolean {
  const needle = text.trim().toLowerCase();
  if (needle.length === 0) return true;
  const haystack = `${product.name} ${product.blurb} ${product.styleTags.join(" ")}`;
  return haystack.toLowerCase().includes(needle);
}

function matchesStyle(product: Product, query: CatalogQuery): boolean {
  const tags = query.styleTags;
  if (!tags || tags.length === 0) return true;
  const own = new Set<string>(product.styleTags);
  return query.requireAllStyleTags
    ? tags.every((tag) => own.has(tag))
    : tags.some((tag) => own.has(tag));
}

export interface CatalogMatch {
  product: Product;
  /** Footprint used for the fit test, so callers can explain why it matched. */
  envelope: FootprintEnvelope;
}

export function searchCatalog(catalog: Catalog, query: CatalogQuery): CatalogMatch[] {
  const matches: CatalogMatch[] = [];

  for (const product of catalog) {
    if (query.categories && !query.categories.includes(product.category)) continue;
    if (query.text !== undefined && !matchesText(product, query.text)) continue;
    if (!matchesStyle(product, query)) continue;
    if (query.maxPriceCents !== undefined && product.priceCents > query.maxPriceCents) {
      continue;
    }
    if (query.minPriceCents !== undefined && product.priceCents < query.minPriceCents) {
      continue;
    }
    if (query.maxHeightMm !== undefined && product.heightMm > query.maxHeightMm) continue;
    if (
      query.minWidthMm !== undefined &&
      Math.max(product.widthMm, product.depthMm) < query.minWidthMm
    ) {
      continue;
    }
    if (
      query.mustFitThroughMm !== undefined &&
      smallestCrossSection(product) > query.mustFitThroughMm
    ) {
      continue;
    }

    const envelope = query.includeClearances
      ? clearanceEnvelope(product)
      : { widthMm: product.widthMm, depthMm: product.depthMm };

    if (!fitsEitherWay(envelope, query.maxWidthMm, query.maxDepthMm)) continue;

    matches.push({ product, envelope });
  }

  matches.sort((a, b) => a.product.priceCents - b.product.priceCents);
  const limit = query.limit ?? matches.length;
  return matches.slice(0, Math.max(0, limit));
}
