import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { layoutTabs } from '@/lib/tabs';
import { source } from '@/lib/source';
import type { ReactNode } from 'react';

// Notebook layout: full-width top nav, sidebar tabs switching between the
// public docs and (in rich mode) the internal KB.
export default function Layout({ children }: { children: ReactNode }) {
  const base = baseOptions();

  return (
    <DocsLayout
      tree={source.pageTree}
      {...base}
      nav={{ ...base.nav, mode: 'top' }}
      tabMode="sidebar"
      tabs={layoutTabs()}
    >
      {children}
    </DocsLayout>
  );
}
