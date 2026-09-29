import Link from 'next/link';
import { siteMeta } from '@/lib/layout.shared';

const staticExport = process.env.DOCKB_STATIC_EXPORT === '1';

export default function Home() {
  const title = siteMeta.name || 'Docs';
  const blurb =
    siteMeta.description ||
    'A reusable, Fumadocs-powered documentation system with first-class support for both humans and AI agents.';

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="max-w-2xl">
        {!staticExport && (
          <div className="mb-4 inline-block rounded-full bg-dockb-dev-bg px-3 py-1 text-xs tracking-widest text-dockb-dev">
            DOCS + AGENTS
          </div>
        )}

        <h1 className="bg-gradient-to-br from-fd-foreground to-fd-primary bg-clip-text text-5xl font-semibold tracking-tighter text-transparent">
          {staticExport ? title : 'DocKB'}
        </h1>
        <p className="mt-3 text-xl text-fd-muted-foreground">{blurb}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/docs"
            className="rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground"
          >
            Browse the docs
          </Link>
          <Link
            href="/docs/guides/getting-started"
            className="rounded-lg border px-5 py-2.5 text-sm font-medium"
          >
            Getting started
          </Link>
        </div>

        {/* Rich mode (kb/dev, comments) is live-server only — never advertise on static Pages. */}
        {!staticExport && (
          <p className="mt-8 text-xs text-fd-muted-foreground">
            Plain mode (no <code>kb/</code>) • Rich mode (with <code>kb/comments/</code> +{' '}
            <code>kb/dev/</code>)
          </p>
        )}
      </div>
    </main>
  );
}
