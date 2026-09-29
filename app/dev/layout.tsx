import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { baseOptions } from '@/lib/layout.shared';
import { layoutTabs } from '@/lib/tabs';
import { hasKB } from '@/lib/kb';
import { buildKBTree } from '@/lib/kb-source';
import type { ReactNode } from 'react';

// kb/ is gitignored and changes at runtime — build the sidebar per request
// (force-static for public static export when kb/ is absent).
export const dynamic = 'force-dynamic';

export default function DevLayout({ children }: { children: ReactNode }) {
  if (!hasKB()) return <>{children}</>;

  const base = baseOptions();

  return (
    <DocsLayout
      tree={buildKBTree()}
      {...base}
      nav={{ ...base.nav, mode: 'top' }}
      tabMode="sidebar"
      tabs={layoutTabs()}
    >
      {children}
    </DocsLayout>
  );
}
