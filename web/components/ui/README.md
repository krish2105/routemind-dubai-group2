# UI components (owner: Gagandeep)

Shared building blocks for every page. Light mode first ("daylight dispatch"); every component uses the tokens in `app/globals.css`, so it also works with the dark toggle. Import from `@/components/ui/<File>`. Ask Gagandeep before changing a file here; adding new usages in your own page is always fine.

**Colour rules:** teal `ai` = AI plan, amber `base` = baseline, red `risk` = SLA risk, green `ok` = good. For **small text** use `text-ai-deep` / `text-base-deep` (the plain `ai`/`base` colours are too light for 14 px text on white). For text on a filled accent button use `bg-ai-deep on-accent`. Do not use `text-base` for colour: in Tailwind it is also the 16 px font-size class.

| Component | File | Use it for |
|---|---|---|
| `Glass` | `Glass.tsx` | White frosted card, the default container |
| `Badge`, `SimBadge` | `Badge.tsx` | Small pills; `SimBadge` = "SIMULATED · ASSUMED DATA" |
| `PageHeader` | `PageHeader.tsx` | Title block of every page (slide, owner, SIMULATED, Assumptions) |
| `KpiCard` | `KpiCard.tsx` | Baseline vs AI number with delta |
| `Stat` | `Stat.tsx` | Big count-up number from `FROZEN`, "n/a until frozen" when null |
| `SegmentedControl` | `SegmentedControl.tsx` | 2 to 4 option switch (Baseline view / AI view) |
| `Tabs` | `Tabs.tsx` | Switch between panels on one page |
| `Tooltip`, `InfoTip` | `Tooltip.tsx` | Short explanation on hover and keyboard focus |
| `Drawer` | `Drawer.tsx` | Side panel or bottom sheet (assumptions, details) |
| `useToast` | `Toast.tsx` | Short status message after an action |
| `Skeleton`, `SkeletonText`, `SkeletonCard` | `Skeleton.tsx` | Loading placeholders while a worker computes |
| `Reveal` | `Reveal.tsx` | Fade-and-rise when a block scrolls into view |
| `OwnerTodo` | `OwnerTodo.tsx` | Starter placeholder: delete it once your page is real |

All interactive parts have visible focus rings and keyboard support (arrows in Tabs and SegmentedControl, Escape in Tooltip and Drawer). Motion respects `prefers-reduced-motion`.

## Usage

### Glass, Badge, SimBadge
```tsx
<Glass className="p-5">
  <Badge tone="ai">AI plan</Badge> <SimBadge />
</Glass>
```

### PageHeader (top of every page, inside `AppShell`)
```tsx
const page = PAGES.find((p) => p.href === "/fleet")!;
<AppShell><PageHeader page={page} />…</AppShell>
```

### KpiCard
```tsx
<KpiCard label="Distance (km)" base={fmt(base.km)} ai={fmt(ai.km)} deltaPct={-12.4} unit="km" />
```

### Stat (count-up; never type a number by hand)
```tsx
import { FROZEN } from "@/lib/frozen";
<Stat value={FROZEN.cost_pct} suffix="%" label="Lower cost per parcel" tone="ai" />
```

### SegmentedControl
```tsx
const [view, setView] = useState<"base" | "ai">("ai");
<SegmentedControl label="Plan" value={view} onChange={setView}
  options={[{ value: "base", label: "Baseline", tone: "base" }, { value: "ai", label: "AI", tone: "ai" }]} />
```

### Tabs
```tsx
<Tabs label="Results" tabs={[
  { id: "kpi", label: "KPIs", content: <KpiGrid /> },
  { id: "routes", label: "Routes", content: <RouteTable /> }]} />
```

### Tooltip and InfoTip (Recharts also exports `Tooltip`: import ours as `Tip` on chart pages)
```tsx
import { Tooltip as Tip, InfoTip } from "@/components/ui/Tooltip";
<Tip content="Cost per delivered parcel (simulated)"><button>Cost/parcel</button></Tip>
<InfoTip content="Baseline = assumed nearest-neighbour plan" />
```

### Drawer
```tsx
const [open, setOpen] = useState(false);
<button onClick={() => setOpen(true)}>Details</button>
<Drawer open={open} onClose={() => setOpen(false)} title="Van 7" description="Simulated route">…</Drawer>
```
`side="bottom"` gives a bottom sheet (used by the phone "More" menu).

### Toast (provider is already in `app/layout.tsx`)
```tsx
const toast = useToast();
toast({ title: "Re-route applied", description: "3 orders moved to van 7", tone: "ai" });
```
Tones: `ai`, `base`, `risk`, `ok`, `neutral`. Default 4 s; hovering pauses it.

### Skeleton
```tsx
{result ? <KpiCard … /> : <SkeletonCard />}
<Skeleton className="h-72 w-full" />   {/* map or chart area */}
<SkeletonText lines={3} />
```

### Reveal
```tsx
<Reveal delay={0.1}><Glass className="p-5">…</Glass></Reveal>
```

## Navigation (`components/nav/`)
- `AppShell` wraps every page except `/`. It adds a "Skip to content" link, the side nav (768 px and up) or a bottom tab bar (phones), and a header with the SIMULATED badge. Your page only renders its content inside it.
- Phone tab bar: Home, Command, Optimizer, Re-route, More (a bottom sheet with all 11 pages). Nothing to do in your page. The bottom padding is already in `AppShell`.
- The active link gets `aria-current="page"` automatically from the URL.
