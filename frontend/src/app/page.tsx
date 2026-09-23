import { ArrowUpRight, BookOpenText, MonitorCheck } from "lucide-react";
import Link from "next/link";

import { ApiStatus } from "@/components/ApiStatus";
import { Reveal } from "@/components/Reveal";
import { SITE } from "@/lib/site";

/**
 * FOUNDATION PLACEHOLDER (Stage 01) — an honest status page proving the stack runs
 * end to end. Stage 26+ replaces this with the real marketing home page.
 * Product UI lives under the private route group added in Stage 05.
 */
export default function Home() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";
  const apiDocs = `${apiBase.replace(/\/api\/v1\/?$/, "")}/api/docs`;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 sm:px-10">
      <header className="flex items-center justify-between border-b border-line py-5">
        <p className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-7 items-center justify-center rounded-md bg-ink font-mono text-sm text-paper"
          >
            §
          </span>
          <span className="text-[15px] font-semibold tracking-tight">{SITE.name}</span>
        </p>
        <p className="rounded-full border border-line px-3 py-1 font-mono text-xs text-ink-soft">
          Foundation · v0.1.0
        </p>
      </header>

      <main className="flex-1">
        <section className="py-16 sm:py-24">
          <Reveal>
            <p className="font-mono text-xs tracking-[0.2em] text-signal uppercase">
              Requirements quality, measured
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <h1 className="mt-4 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.02em] text-balance sm:text-6xl">
              {SITE.tagline}
            </h1>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
              This is the running foundation: versioned API, typed client, design tokens, and
              project contract. The deterministic ambiguity engine, analyzer, and dashboard land
              stage by stage — tracked in{" "}
              <span className="font-mono text-[0.9em]">docs/STAGE_STATUS.md</span>.
            </p>
          </Reveal>
        </section>

        <section aria-label="System status" className="grid gap-4 pb-16 sm:grid-cols-3 sm:pb-24">
          <Reveal delay={0.05}>
            <div className="h-full rounded-card border border-line bg-paper p-5">
              <p className="font-mono text-xs tracking-widest text-ink-faint uppercase">Web</p>
              <div className="mt-3 flex items-center gap-2.5">
                <MonitorCheck className="size-5 text-signal" aria-hidden />
                <span className="text-sm font-medium">Serving this page</span>
              </div>
              <p className="mt-2 font-mono text-xs text-ink-faint">Next.js · Tailwind v4</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <ApiStatus className="h-full" />
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex h-full flex-col rounded-card border border-line bg-paper p-5">
              <p className="font-mono text-xs tracking-widest text-ink-faint uppercase">Contract</p>
              <div className="mt-3 flex items-center gap-2.5">
                <BookOpenText className="size-5 text-signal" aria-hidden />
                <span className="text-sm font-medium">OpenAPI · v1 envelope</span>
              </div>
              <Link
                href={apiDocs}
                className="mt-auto inline-flex w-fit items-center gap-1 pt-3 text-sm font-medium text-signal underline-offset-4 hover:underline"
              >
                Browse the API docs <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
          </Reveal>
        </section>

        <section aria-label="Analysis philosophy" className="border-t border-line py-10">
          <p className="font-mono text-xs leading-loose break-words text-ink-faint">
            text → validate → segment → <span className="text-signal">deterministic engine</span> →
            severity + evidence → score →{" "}
            <span className="text-ink-soft">optional AI enhancement</span> → unified result
          </p>
        </section>
      </main>

      <footer className="flex flex-col gap-2 border-t border-line py-6 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <p>Deterministic engine first. AI optional, user-owned, fail-open.</p>
        <p className="font-mono text-xs">Stage 01 · contract + foundation</p>
      </footer>
    </div>
  );
}
