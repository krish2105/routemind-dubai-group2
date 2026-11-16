import type { PageInfo } from "@/lib/pages";

/** Page title + "what this means for operations". The SIMULATED badge lives in the app shell top bar. */
export function PageHeader({ page }: { page: PageInfo }) {
  return (
    <header className="mb-8">
      <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">{page.title}</h1>
      <p className="mt-2 max-w-2xl text-slate-600"><span className="font-medium text-ai-deep">What this means for operations:</span> {page.meaning}</p>
    </header>
  );
}
