import { Glass } from "./Glass";
import type { PageInfo } from "@/lib/pages";

/** Placeholder block. The page owner DELETES this component from their page once the real feature is built. */
export function OwnerTodo({ page }: { page: PageInfo }) {
  return (
    <Glass className="border-dashed p-6">
      <div className="text-xs uppercase tracking-widest text-base">Starter page, owner: {page.owner}</div>
      <p className="mt-2 text-slate-700">Build these, then delete this box:</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-500">
        {page.todo.map((t) => <li key={t}>{t}</li>)}
      </ul>
      <p className="mt-4 text-xs text-slate-500">Your Claude Code prompt: prompts/members/{page.owner}.md</p>
    </Glass>
  );
}
