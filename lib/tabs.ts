import type { LayoutTab } from 'fumadocs-ui/layouts/shared';
import { hasKB } from '@/lib/kb';

/**
 * The two content roots, as notebook tabs above the sidebar. The Dev KB tab
 * only exists in rich mode — in plain mode there is a single tab and the
 * switcher collapses to a plain title.
 */
export function layoutTabs(): LayoutTab[] {
  const tabs: LayoutTab[] = [
    {
      title: 'Documentation',
      description: 'Public docs',
      url: '/docs',
    },
  ];

  if (hasKB()) {
    tabs.push({
      title: 'Dev KB',
      description: 'Internal — kb/dev',
      url: '/dev',
    });
  }

  return tabs;
}
