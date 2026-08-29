# Lares

**Describe your room out loud. Watch it get furnished — with real clearances checked.**

Lares is a browser-based interior layout and furniture planner built for the
[WebMCP](https://github.com/webmachinelearning/webmcp) standard. You talk to an agent, and
your floor plan builds itself: walls, doors, windows, furniture, costs. Every placement is
checked against real-world circulation and clearance rules, so the plan you end up with is
one you could actually live in — and actually buy.

- **Live demo:** _TBD — deployed URL goes here_
- **Demo video:** _TBD — YouTube link goes here_
- **Requires:** ChatGPT's in-app browser, or Chrome 149+ with `chrome://flags/#enable-webmcp-testing`

---

## The problem

Tools like the IKEA Home Planner, Planner 5D, and RoomSketcher all work, technically. They
also have brutal abandonment rates, and the reason is not the concept — it's the input
method. Drawing walls that refuse to snap. Hunting through category trees. Nudging a sofa
50mm at a time. Fighting a 3D camera. Everything you want from these tools is trivial to
*say* and miserable to *do with a mouse*.

Meanwhile, furniture retail has the opposite problem. Sites are excellent at showing you a
sofa and terrible at answering the only question that matters: **will it fit?** Not "is it
big" — will it get through the doorway, clear the door swing, and still leave room to walk
past? People get this wrong constantly, and returning a sofa is expensive.

## What Lares does

Lares treats the floor plan as shared state between you and an agent, and puts a real
constraint solver underneath it.

**Describing a room replaces drawing one.** "It's 4.2 by 3.8, door on the north wall near
the left corner, window along the east wall, and a 600mm bulkhead in the top-right corner"
is ten seconds of speech and five minutes of mouse work. The agent calls one tool and the
plan appears.

**Describing a layout replaces placing one.** "Two-seater facing the window, TV opposite, a
dining table for four near the kitchen side, keep it under $3,000, warm timber tones." The
agent searches a catalog that is filtered by *what physically fits*, places everything, and
prices it.

**Clearances are enforced, not suggested.** Every layout is validated against real
circulation standards — 900mm primary walkways, 700mm secondary, 900mm dining chair
pull-out, door swing arcs, bed side access, wardrobe door depth. Violations come back as
structured findings, which means the agent can *see* that it made a mistake and fix it
without being told.

**You stay in control of the plan.** The agent's edits land on a canvas you can drag,
rotate, and undo directly. Because the page holds the state, your next instruction can just
be "no, rotate that" and it knows what you mean.

## Why this is a strong fit for WebMCP

WebMCP exists because agents driving web UIs by scraping the DOM is unreliable — every
inferred click is a chance to be wrong. Interior layout is close to a worst case for DOM
actuation and close to a best case for declared tools:

**The state is spatial and structured.** A floor plan is geometry, not text. An agent
reading pixels cannot know that a rectangle is a wardrobe whose doors need 600mm of swing
clearance. Lares declares it. `get_room` and `list_placements` hand the agent exact
coordinates and dimensions; there is nothing to infer.

**Shared state is the whole interaction.** "Move the sofa 200 left," "swap that for
something cheaper," "the one I just selected" — these are only meaningful because the page
and the agent are looking at the same document. This is the capability that separates
WebMCP from simply exposing a REST API, and a layout tool leans on it in every single turn.

**Execution has to be visible.** In a booking flow, watching the agent work is
reassurance. Here it's the feedback loop: you form your next instruction *by looking at
what changed*. Tools that run in the live page, rather than headlessly against an API, are
the only way this product works.

**The permission boundary is real, not decorative.** Rearranging is free and reversible, so
the agent does it without asking. Checkout spends money, so it is gated behind explicit
human confirmation, following Chrome's guidance for sensitive actions.

## What people and agents can do together that was difficult before

The honest claim is not "the agent shops for you." It's this:

**Describing a physical space out loud is now a viable input method for spatial design.**

Before, translating a room in your head into a digital plan required learning a CAD-adjacent
UI, and most people quit before finishing. And separately, checking whether a real purchase
fits a real room required manual measurement against a spec sheet, so most people skipped it
and hoped. Lares collapses both: the description becomes the model, and the model is
continuously validated against the rules that determine whether a space is livable.

The moment that best demonstrates it: the agent places a dining table, the clearance check
reports that chairs only have 640mm to pull out against a 900mm requirement, and the agent
moves the table and re-checks — unprompted, because the tool told it the truth in a form it
could act on.

## How WebMCP is implemented

Tools are registered on `document.modelContext` via `registerTool`, feature-detected, and
scoped to the page lifecycle with an `AbortController` signal. The surface is split into
read and write tools, with sensitive actions gated.

### Read tools

| Tool | Purpose |
| --- | --- |
| `get_room` | Current room geometry: walls, openings, fixed obstructions |
| `list_placements` | Everything currently placed, with position and rotation |
| `search_catalog` | Search products, filtered by what physically fits the room |
| `check_layout` | Validate clearances; returns structured violations |
| `get_cost_breakdown` | Itemised cost against budget |

### Write tools

| Tool | Purpose |
| --- | --- |
| `define_room` | Create or replace room geometry from a description |
| `place_item` | Add a product at a position and rotation |
| `move_item` / `rotate_item` / `remove_item` | Adjust a single placement |
| `swap_product` | Replace a placement's product, preserving position |
| `apply_layout` | Batch placement for a whole-room proposal |
| `set_budget` | Set the budget constraint |

### Gated tools

| Tool | Purpose |
| --- | --- |
| `checkout` | Requires explicit user confirmation before proceeding |

Input schemas are strict — enumerated categories, bounded dimensions in millimetres,
`additionalProperties: false` — so the agent gets guardrails rather than a free-text field.
Tool results are structured findings rather than acknowledgements, which is what lets the
agent self-correct.

## Running locally

```bash
git clone https://github.com/MichaelHo02/lares.git
cd lares
npm install
npm run dev
```

Then open the dev URL in one of:

- **ChatGPT's in-app browser** — WebMCP is supported out of the box.
- **Chrome 149+** — set `chrome://flags/#enable-webmcp-testing` to Enabled and relaunch.

To inspect and manually invoke tools without an agent, install Chrome's
[Model Context Tool Inspector extension](https://developer.chrome.com/docs/ai/webmcp),
which lists registered tools and validates your schemas.

### Try these prompts

1. "My living room is 4.2m by 3.8m, door on the north wall, window on the east wall."
2. "Furnish it for someone who works from home. Budget $3,000."
3. "Check the clearances."
4. "Swap the sofa for something in a warmer timber."

## Project status

Built for the [WebMCP Challenge](https://webmcp.devpost.com) (submission deadline
3 September 2026). WebMCP is an experimental standard under active development; this project
targets the `document.modelContext` imperative API as of the July 2026 Community Group
draft.

## License

[MIT](./LICENSE)
