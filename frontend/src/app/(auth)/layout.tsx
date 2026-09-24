import type { Metadata } from "next";

/**
 * Auth route group — private pages, never indexed (docs/SEO_SPEC.md).
 * The `m-auto` child centers without clipping tall cards on short viewports.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh bg-paper-deep px-4 py-10 sm:px-6">
      <div className="m-auto flex w-full justify-center">{children}</div>
    </main>
  );
}
