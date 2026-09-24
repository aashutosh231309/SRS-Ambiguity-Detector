import Link from "next/link";
import { ArrowRight, CheckCircle2, FileText, LockKeyhole, ShieldCheck } from "lucide-react";

import { AnalyzerEntryLink } from "@/components/analyzer/AnalyzerEntryLink";
import { Container } from "@/components/layout/Container";
import { homeStructuredData, publicPageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata = publicPageMetadata({
  title: `${SITE.name} — Requirements ambiguity analysis`,
  description: SITE.description,
  path: "/",
});

const highlights = [
  "Detect vague, subjective, optional, and unmeasurable requirement language.",
  "Review categorized findings with severity, explanations, and rewrite guidance.",
  "Keep dashboards, history, and saved reports private behind your account.",
];

const capabilities = [
  {
    icon: FileText,
    title: "SRS-focused analysis",
    copy: "Paste text or upload supported documents to surface requirement ambiguity patterns before review meetings.",
  },
  {
    icon: CheckCircle2,
    title: "Traceable findings",
    copy: "Each issue is grouped by category and severity so teams can prioritize measurable requirement improvements.",
  },
  {
    icon: LockKeyhole,
    title: "Private by default",
    copy: "Analysis workspace, history, dashboards, and report URLs are authenticated and marked noindex.",
  },
];

export default function HomePage() {
  const structuredData = homeStructuredData();

  return (
    <main className="min-h-dvh bg-paper text-ink">
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      <Container className="py-10 sm:py-14 lg:py-20">
        <nav className="flex items-center justify-between gap-4" aria-label="Primary">
          <Link href="/" className="font-serif text-xl font-semibold tracking-tight">
            {SITE.name}
          </Link>
          <div className="flex items-center gap-3">
            <AnalyzerEntryLink />
            <Link href="/login" className="text-sm font-medium text-ink-soft hover:text-ink">
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:-translate-y-px hover:shadow"
            >
              Sign up
            </Link>
          </div>
        </nav>

        <section className="grid gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <p className="font-mono text-xs tracking-[0.24em] text-signal uppercase">
              SRS ambiguity detection
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Find ambiguous software requirements before they become rework.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-ink-soft">
              {SITE.name} helps teams inspect Software Requirements Specifications for vague,
              incomplete, subjective, and hard-to-test language while keeping authenticated analysis
              content out of search indexes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-input bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-sm transition hover:-translate-y-px hover:bg-black"
              >
                Create an account <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-input border border-line bg-white px-5 py-3 text-sm font-semibold transition hover:-translate-y-px hover:shadow-sm"
              >
                Log in to analyze
              </Link>
            </div>
            <ul className="mt-8 grid gap-3 text-sm text-ink-soft" aria-label="Product highlights">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside
            className="rounded-[2rem] border border-line bg-white p-6 shadow-xl shadow-ink/5"
            aria-label="Example ambiguity finding summary"
          >
            <div className="rounded-2xl bg-paper-deep p-5">
              <p className="font-mono text-xs tracking-[0.2em] text-ink-faint uppercase">
                Example check
              </p>
              <p className="mt-4 text-lg font-semibold">
                “The system should be fast and user friendly.”
              </p>
              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-line bg-white p-4">
                  <p className="text-sm font-semibold text-sev-high">Ambiguous adjective</p>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">
                    “Fast” needs a measurable threshold such as response time or throughput.
                  </p>
                </div>
                <div className="rounded-xl border border-line bg-white p-4">
                  <p className="text-sm font-semibold text-sev-medium">Subjective phrase</p>
                  <p className="mt-1 text-sm leading-6 text-ink-soft">
                    “User friendly” should reference usability criteria or acceptance tests.
                  </p>
                </div>
              </div>
            </div>
            <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-ink-soft">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-signal" aria-hidden />
              Public marketing metadata is generic; private analysis reports never expose user text,
              document names, IDs, or tokenized URLs.
            </p>
          </aside>
        </section>

        <section
          className="grid gap-4 border-t border-line pt-10 md:grid-cols-3"
          aria-labelledby="capabilities-heading"
        >
          <h2 id="capabilities-heading" className="sr-only">
            Product capabilities
          </h2>
          {capabilities.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="rounded-2xl border border-line bg-white p-6 shadow-sm"
              >
                <Icon className="size-6 text-signal" aria-hidden />
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{item.copy}</p>
              </article>
            );
          })}
        </section>
      </Container>
    </main>
  );
}
