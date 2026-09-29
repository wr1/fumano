import fs from 'node:fs';
import path from 'node:path';
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { projectRoot } from '@/lib/kb';

type SiteMeta = {
  /** Short name, used in the nav and the title template. */
  name: string;
  /** Title for pages that don't set their own. */
  title: string;
  description: string;
  /**
   * Repo holding the public docs. Drives the "Open in GitHub" entry of the page
   * actions; set to null to drop that entry. kb/dev never gets one — it lives in
   * its own gitignored repo.
   */
  github: { url: string; branch: string } | null;
};

const defaults: SiteMeta = {
  name: 'DocKB',
  title: 'DocKB — Docs-driven development with agent support',
  description:
    'A reusable Fumadocs-based documentation system with rich commenting (kb/comments) and internal knowledge (kb/dev). Works in plain or rich mode. Excellent for humans and AI agents.',
  github: { url: 'https://github.com/wr1/fumano', branch: 'main' },
};

/**
 * Site identity — a project states who it is in a `dockb.json` at its root:
 *   { "name": "...", "title": "...", "description": "...",
 *     "github": { "url": "...", "branch": "main" } | null }
 *
 * With the shared runtime, one installed app serves many projects, so identity
 * must live in the project, not in this file. Embedded installs may still edit
 * the defaults above instead. Missing file or fields → defaults.
 */
function loadSiteMeta(): SiteMeta {
  try {
    const raw = fs.readFileSync(path.join(projectRoot(), 'dockb.json'), 'utf8');
    return { ...defaults, ...(JSON.parse(raw) as Partial<SiteMeta>) };
  } catch {
    return defaults;
  }
}

export const siteMeta = loadSiteMeta();

/** GitHub URL for a repo-relative source file, e.g. "docs/guides/index.mdx". */
export function githubFileUrl(file: string): string | undefined {
  if (!siteMeta.github) return undefined;
  return `${siteMeta.github.url}/blob/${siteMeta.github.branch}/${file}`;
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: siteMeta.name,
    },
    links: siteMeta.github
      ? [{ text: 'GitHub', url: siteMeta.github.url }]
      : [],
  };
}
