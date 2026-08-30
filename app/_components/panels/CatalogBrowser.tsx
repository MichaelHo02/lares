"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  CATEGORY_GLYPHS,
  CATEGORY_LABELS,
  PRODUCT_CATEGORIES,
  type ProductCategory,
  type StyleTag,
} from "@/lib/domain/product";
import { placeItem } from "@/lib/store/operations";
import { usePlannerStore } from "@/lib/store/store";
import { Button, Card, Chip, Input, Panel, Price } from "@/app/_components/ui";

/**
 * IKEA-like catalog browse: filter by room function / style, add to the studio.
 * Placement lands near the room centre so the agent (or user) can refine.
 */
export function CatalogBrowser({ compact = false }: { compact?: boolean }) {
  const room = usePlannerStore((state) => state.room);
  const catalog = usePlannerStore((state) => state.catalog);
  const [category, setCategory] = useState<ProductCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<StyleTag | "all">("all");

  const themes = useMemo(() => {
    const tags = new Set<StyleTag>();
    for (const product of catalog) {
      for (const tag of product.styleTags) tags.add(tag);
    }
    return [...tags].sort();
  }, [catalog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((product) => {
      if (category !== "all" && product.category !== category) return false;
      if (theme !== "all" && !product.styleTags.includes(theme)) return false;
      if (!q) return true;
      return (
        product.name.toLowerCase().includes(q) ||
        product.blurb.toLowerCase().includes(q) ||
        product.styleTags.some((tag) => tag.includes(q))
      );
    });
  }, [catalog, category, query, theme]);

  function addProduct(productId: string) {
    if (!room) return;
    const product = catalog.find((item) => item.id === productId);
    if (!product) return;
    const x = Math.max(200, Math.round(room.widthMm / 2 - product.widthMm / 2));
    const y = Math.max(200, Math.round(room.depthMm / 2 - product.depthMm / 2));
    placeItem({
      productId,
      x,
      y,
      rotation: 0,
      source: "user",
    });
  }

  const filters = (
    <>
      <Input
        label="Search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Sofa, oak, coastal…"
      />

      <ChipScroller>
        <Chip selected={category === "all"} onClick={() => setCategory("all")}>
          All
        </Chip>
        {PRODUCT_CATEGORIES.map((item) => (
          <Chip
            key={item}
            selected={category === item}
            onClick={() => setCategory(item)}
          >
            {CATEGORY_LABELS[item]}
          </Chip>
        ))}
      </ChipScroller>

      <ChipScroller>
        <Chip selected={theme === "all"} onClick={() => setTheme("all")}>
          Any theme
        </Chip>
        {themes.slice(0, 10).map((tag) => (
          <Chip key={tag} selected={theme === tag} onClick={() => setTheme(tag)}>
            {tag}
          </Chip>
        ))}
      </ChipScroller>
    </>
  );

  if (compact) {
    return (
      <div className="flex flex-col gap-3 p-3">
        {filters}
        <ul className="flex flex-col">
          {filtered.map((product) => (
            <li
              key={product.id}
              className="flex items-center gap-2 border-b border-hairline py-2"
            >
              <span className="text-xl" aria-hidden>
                {CATEGORY_GLYPHS[product.category]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body-m truncate font-bold text-ink">{product.name}</p>
                <p className="text-caption-m text-ink-3">
                  {CATEGORY_LABELS[product.category]} · {product.widthMm}×
                  {product.depthMm}mm
                </p>
              </div>
              <Price amount={product.priceCents / 100} size="small" />
              <Button
                size="small"
                disabled={!room}
                title={room ? undefined : "Describe the room first"}
                onClick={() => addProduct(product.id)}
              >
                Add
              </Button>
            </li>
          ))}
        </ul>
        {filtered.length === 0 ? (
          <p className="text-body-s text-ink-3">No products match these filters.</p>
        ) : null}
      </div>
    );
  }

  return (
    <Panel title="Shop furniture" variant="plain">
      <div className="flex flex-col gap-3">
        {filters}
        <div className="grid grid-cols-1 gap-0 border-l border-t border-hairline">
          {filtered.slice(0, 24).map((product) => (
            <Card
              key={product.id}
              title={product.name}
              meta={`${CATEGORY_LABELS[product.category]} · ${product.widthMm}×${product.depthMm}mm`}
              price={<Price amount={product.priceCents / 100} size="small" />}
              media={
                <div className="flex h-full items-center justify-center text-4xl">
                  {CATEGORY_GLYPHS[product.category]}
                </div>
              }
              action={
                <Button
                  size="small"
                  fullWidth
                  disabled={!room}
                  title={room ? undefined : "Describe the room first"}
                  onClick={() => addProduct(product.id)}
                >
                  Add to room
                </Button>
              }
            >
              <p className="text-caption-m text-ink-3">{product.blurb}</p>
            </Card>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="text-body-s text-ink-3">No products match these filters.</p>
        ) : null}
      </div>
    </Panel>
  );
}

function ChipScroller({ children }: { children: ReactNode }) {
  return (
    <div className="min-w-0 overflow-x-auto [scrollbar-width:thin]">
      <div className="flex w-max flex-nowrap gap-2 px-0.5 py-0.5 [&>*]:shrink-0 [&>*]:whitespace-nowrap">
        {children}
      </div>
    </div>
  );
}
