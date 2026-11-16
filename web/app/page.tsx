import Link from "next/link";
import { HeroStory } from "@/components/three/HeroStory";
import { Reveal } from "@/components/ui/Reveal";
import { Glass } from "@/components/ui/Glass";
import { PAGES } from "@/lib/pages";

/** Landing page (owner: Gagandeep): 3D scroll story, then the grid of the 11 prototype pages. */
export default function Landing() {
  return (
    <div className="backdrop min-h-screen">
      <HeroStory />

      <section aria-labelledby="explore" className="mx-auto max-w-6xl px-5 pb-20 pt-24 sm:px-8">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ai-deep">The prototype</p>
          <h2 id="explore" className="mt-2 text-3xl font-semibold tracking-tight text-fg sm:text-4xl">Explore all {PAGES.length} pages</h2>
          <p className="mt-3 max-w-2xl text-slate-700">Each page is built by one member of Group 2 and feeds one slide of the presentation.</p>
        </Reveal>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PAGES.map((p, i) => (
            <li key={p.href}>
              <Reveal delay={(i % 3) * 0.06}>
                <Link href={p.href} className="group block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ai">
                  <Glass className="flex h-full flex-col p-5 transition duration-300 group-hover:-translate-y-1 group-hover:border-ai/40 group-hover:shadow-[0_18px_40px_-18px_rgba(8,145,178,0.45)]">
                    <div className="flex items-start justify-between gap-3">
                      <span className="font-semibold text-fg">{p.title}</span>
                      <span className="shrink-0 rounded-full border border-ai/30 bg-ai/10 px-2.5 py-0.5 text-[11px] font-semibold text-ai-deep">Slide {p.slide}</span>
                    </div>
                    <p className="mt-2 flex-1 text-sm text-slate-600">{p.meaning}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-white/80 py-0.5 pl-0.5 pr-2.5 text-xs font-medium text-slate-700">
                        <span aria-hidden className="grid h-5 w-5 place-items-center rounded-full bg-fg text-[10px] font-semibold text-paper">{p.owner[0]}</span>
                        {p.owner}
                      </span>
                      <span aria-hidden className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-ai-deep">→</span>
                    </div>
                  </Glass>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-slate-900/10">
        <div className="mx-auto max-w-6xl px-5 py-8 text-sm text-slate-600 sm:px-8">
          <p className="font-medium text-fg">Simulated prototype, assumed data (DubaiDash Express is fictional)</p>
          <p className="mt-1 text-xs">Group 2 · AI in Operations (MAIB AI 218) · SP Jain Dubai. Prototype built with AI assistance (Claude Code); prompts shared separately.</p>
        </div>
      </footer>
    </div>
  );
}
