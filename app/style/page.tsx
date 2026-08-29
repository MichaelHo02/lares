import type { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Button,
  Card,
  Chip,
  Finding,
  FindingList,
  Input,
  Panel,
  Price,
} from "@/app/_components/ui";

export const metadata: Metadata = {
  title: "Lares — Style reference",
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6 border-b border-hairline py-12">
      <h2 className="text-heading-l font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={`h-16 w-full rounded-card shadow-ring-hairline ${className}`}
      />
      <span className="text-body-s text-ink-2">{name}</span>
    </div>
  );
}

export default function StylePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-section">
      <header className="flex flex-col gap-2 py-12">
        <span className="text-label-xs font-bold uppercase tracking-wide text-ink-2">
          Design foundation
        </span>
        <h1 className="text-display-m font-bold text-ink">Lares style reference</h1>
        <p className="text-statement-m text-ink-2">
          Every token and primitive, in every variant.
        </p>
      </header>

      <Section title="Colour">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          <Swatch name="neutral-1" className="bg-neutral-1" />
          <Swatch name="neutral-2" className="bg-neutral-2" />
          <Swatch name="neutral-3" className="bg-neutral-3" />
          <Swatch name="neutral-4" className="bg-neutral-4" />
          <Swatch name="neutral-5" className="bg-neutral-5" />
          <Swatch name="neutral-6" className="bg-neutral-6" />
          <Swatch name="neutral-7" className="bg-neutral-7" />
          <Swatch name="action" className="bg-action" />
          <Swatch name="emphasis" className="bg-emphasis" />
          <Swatch name="accent-yellow" className="bg-accent-yellow" />
          <Swatch name="accent-blue" className="bg-accent-blue" />
          <Swatch name="positive" className="bg-positive" />
          <Swatch name="negative" className="bg-negative" />
          <Swatch name="caution" className="bg-caution" />
          <Swatch name="caution-text" className="bg-caution-text" />
          <Swatch name="informative" className="bg-informative" />
          <Swatch name="price-drop" className="bg-price-drop" />
          <Swatch name="canvas-bg" className="bg-canvas-bg" />
          <Swatch name="footprint-fill" className="bg-footprint-fill" />
          <Swatch name="footprint-stroke" className="bg-footprint-stroke" />
          <Swatch name="clearance-fill" className="bg-clearance-fill" />
        </div>
      </Section>

      <Section title="Type scale">
        <div className="flex flex-col gap-3">
          <p className="text-display-l font-bold">Display L — 56/700</p>
          <p className="text-display-m font-bold">Display M — 40/700</p>
          <p className="text-heading-xl font-bold">Heading XL — 32/700</p>
          <p className="text-heading-l font-bold">Heading L — 24/700</p>
          <p className="text-heading-m font-bold">Heading M — 18/700</p>
          <p className="text-heading-s font-bold">Heading S — 16/700</p>
          <p className="text-statement-m">Statement M — 20/400</p>
          <p className="text-body-l">Body L — 16/400</p>
          <p className="text-body-m text-ink-2">Body M — 14/400</p>
          <p className="text-body-s text-ink-2">Body S — 12/400, loose leading</p>
          <p className="text-label-xs font-bold uppercase tracking-wide text-ink-2">
            Label XS — 10/700 uppercase
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Add to plan</Button>
          <Button variant="emphasis">Add all to plan</Button>
          <Button variant="secondary">Edit room</Button>
          <Button variant="tertiary">Cancel</Button>
          <Button variant="destructive">Remove</Button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary" size="small">
            Add to plan
          </Button>
          <Button variant="emphasis" size="small">
            Add all
          </Button>
          <Button variant="secondary" size="small">
            Edit
          </Button>
          <Button variant="tertiary" size="small">
            Cancel
          </Button>
          <Button variant="destructive" size="small">
            Remove
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="tertiary" disabled>
            Disabled
          </Button>
          <Button variant="primary" fullWidth className="max-w-sm">
            Full width
          </Button>
        </div>
      </Section>

      <Section title="Price">
        <div className="flex flex-wrap items-end gap-12">
          <Price amount={899} />
          <Price amount={699} variant="reduced" wasAmount={899} />
          <Price amount={49.95} size="small" />
          <span className="text-body-m text-ink-2 tabular-nums">$4.99 / m²</span>
        </div>
      </Section>

      <Section title="Chips">
        <div className="flex flex-wrap items-center gap-3">
          <Chip>Sofas</Chip>
          <Chip selected>Storage</Chip>
          <Chip count={12}>Under $500</Chip>
          <Chip selected count={3}>
            Timber
          </Chip>
          <Chip disabled>Outdoor</Chip>
        </div>
      </Section>

      <Section title="Inputs">
        <div className="grid gap-6 sm:grid-cols-3">
          <Input
            label="Room width"
            suffix="mm"
            placeholder="4200"
            hint="Interior wall to wall."
          />
          <Input
            label="Room depth"
            suffix="mm"
            defaultValue="3800"
            error="Must be at least 1000 mm."
          />
          <Input label="Plan name" placeholder="Living room" disabled />
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid grid-cols-2 border-l border-t border-hairline sm:grid-cols-3">
          <Card
            title="Vinstra two-seat sofa"
            meta="Grey · 180 × 88 cm"
            badge="New"
            price={<Price amount={899} />}
            action={
              <Button size="small" variant="primary">
                Add to plan
              </Button>
            }
          />
          <Card
            title="Halden coffee table"
            meta="Oak · 110 × 60 cm"
            badge="New lower price"
            badgeTone="offer"
            price={<Price amount={149} variant="reduced" wasAmount={199} />}
            action={
              <Button size="small" variant="secondary">
                Add to plan
              </Button>
            }
          />
          <Card
            title="Rennes shelf unit"
            meta="White · 80 × 30 cm"
            price={<Price amount={249} />}
            action={
              <Button size="small" variant="primary">
                Add to plan
              </Button>
            }
          />
        </div>
      </Section>

      <Section title="Panels">
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel
            title="Budget"
            variant="plain"
            footer={
              <div className="flex items-baseline justify-between text-heading-l font-bold text-ink tabular-nums">
                <span>Total</span>
                <Price amount={1297} size="small" />
              </div>
            }
          >
            <p className="text-body-m text-ink-2">Three items placed.</p>
          </Panel>
          <Panel title="Catalog" variant="sheet">
            <p className="text-body-m text-ink-2">
              Floating sheet — the one place a shadow is allowed.
            </p>
          </Panel>
          <Panel variant="sunken">
            <p className="text-body-m text-ink-2">
              Sunken sub-section inside a panel.
            </p>
          </Panel>
        </div>
      </Section>

      <Section title="Findings">
        <FindingList className="rounded-card border border-hairline">
          <Finding
            severity="error"
            title="Door swing blocked"
            detail="Wardrobe overlaps the entry door arc by 180 mm."
            action={
              <Button variant="tertiary" size="small" className="px-0">
                Show on plan
              </Button>
            }
          />
          <Finding
            severity="warning"
            title="Walkway too narrow"
            detail="640 mm between sofa and coffee table. Minimum 750 mm."
          />
          <Finding
            severity="info"
            title="Window partly covered"
            detail="Shelf unit sits 120 mm into the window reveal."
          />
          <Finding
            severity="pass"
            title="Dining chair pull-out clear"
            detail="960 mm available. Minimum 900 mm."
          />
        </FindingList>
      </Section>
    </main>
  );
}
