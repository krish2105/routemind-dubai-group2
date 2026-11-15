import { Badge, SimBadge } from "./Badge";
import { AssumptionsButton } from "@/components/assumptions/AssumptionsDrawer";
import type { PageInfo } from "@/lib/pages";

export function PageHeader({ page }: { page: PageInfo }) {
  return (
    <header className="mb-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="ai">Slide {page.slide}</Badge>
        <Badge>{page.question}</Badge>
        <Badge>Owner: {page.owner}</Badge>
        <SimBadge />
        <AssumptionsButton />
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{page.title}</h1>
      <p className="mt-2 max-w-2xl text-slate-500"><span className="text-ai">What this means for operations:</span> {page.meaning}</p>
    </header>
  );
}
