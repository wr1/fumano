'use client';

import { useEffect, useId, useState } from 'react';

/**
 * Client-side mermaid renderer. Used by remarkMdxMermaid, which turns
 * ```mermaid fences into <Mermaid chart="..."/>. Theme follows the site.
 *
 * The theme is read from the `dark` class on <html>, which next-themes applies
 * *after* hydration — so we cannot read it once and be done: that races the
 * provider (and renders a light diagram on a dark page), and it would ignore the
 * theme toggle entirely. Observe the class instead and re-render on change.
 */
export function Mermaid({ chart }: { chart: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState<string>('');
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const read = () => setDark(document.documentElement.classList.contains('dark'));
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (dark === null) return; // theme not resolved yet
    let cancelled = false;
    void import('mermaid').then(async ({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        theme: dark ? 'dark' : 'neutral',
        securityLevel: 'strict',
      });
      try {
        const { svg } = await mermaid.render(`mmd${id}${dark ? 'd' : 'l'}`, chart);
        if (!cancelled) setSvg(svg);
      } catch {
        if (!cancelled) setSvg('');
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chart, id, dark]);

  if (!svg) {
    return (
      <pre className="text-xs text-fd-muted-foreground">
        <code>{chart}</code>
      </pre>
    );
  }
  // Wide diagrams scroll rather than clip. Note mermaid still shrinks-to-fit the
  // container (useMaxWidth), so keep rows narrow — see the Mermaid field notes.
  return (
    <div className="my-6 overflow-x-auto">
      {/* eslint-disable-next-line react/no-danger */}
      <div className="flex min-w-fit justify-center" dangerouslySetInnerHTML={{ __html: svg }} />
    </div>
  );
}
