import fs from 'node:fs';
import path from 'node:path';
import type * as PageTree from 'fumadocs-core/page-tree';
import { getDevDir } from '@/lib/kb';

/** Recursively list markdown files under kb/dev, README first. */
export function listKBFiles(dir = getDevDir(), base = ''): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) out.push(...listKBFiles(path.join(dir, entry.name), rel));
    else if (entry.name.endsWith('.md')) out.push(rel);
  }
  return out.sort((a, b) =>
    (path.basename(a) === 'README.md' ? '' : a).localeCompare(
      path.basename(b) === 'README.md' ? '' : b,
    ),
  );
}

/** First `title:` from YAML frontmatter, if the file has one. */
function frontmatterTitle(full: string): string | null {
  try {
    const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(fs.readFileSync(full, 'utf8'));
    if (!block) return null;
    const title = /^title:\s*(.+?)\s*$/m.exec(block[1]);
    return title ? title[1].replace(/^['"]|['"]$/g, '') || null : null;
  } catch {
    return null;
  }
}

/** "state-machines" -> "State machines" */
function humanize(name: string): string {
  const s = name.replace(/[-_]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Display title for a kb/dev file: frontmatter `title:` when present, else the
 * filename humanized. Shared by the sidebar and the search index so a page is
 * called the same thing in both.
 */
export function kbFileTitle(rel: string): string {
  const full = path.join(getDevDir(), rel);
  return frontmatterTitle(full) ?? humanize(path.basename(rel, '.md'));
}

/** Folder names above a kb/dev file, for search breadcrumbs. */
export function kbBreadcrumbs(rel: string): string[] {
  return ['Internal KB', ...path.dirname(rel).split('/').filter((s) => s && s !== '.').map(humanize)];
}

function pageItem(full: string, rel: string): PageTree.Item {
  return {
    type: 'page',
    name: frontmatterTitle(full) ?? humanize(path.basename(rel, '.md')),
    url: `/dev/${rel}`,
  };
}

/**
 * Mirror the kb/dev directory structure as real page-tree nodes.
 *
 * Subdirectories become collapsible folders, so the sidebar folds the way the
 * public docs tree does rather than flattening `arch/overview.md` into a single
 * item literally named "arch/overview". A README.md inside a folder becomes
 * that folder's index page (clicking the folder name opens it).
 */
function buildNodes(dir: string, base: string): PageTree.Node[] {
  const entries = fs
    .readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name));

  const folders: PageTree.Folder[] = [];
  const pages: PageTree.Item[] = [];

  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const children = buildNodes(full, rel);
      if (children.length === 0) continue; // don't show empty folders

      const folder: PageTree.Folder = {
        type: 'folder',
        name: humanize(entry.name),
        collapsible: true,
        children,
      };

      const readme = path.join(full, 'README.md');
      if (fs.existsSync(readme)) folder.index = pageItem(readme, `${rel}/README.md`);

      folders.push(folder);
      continue;
    }

    if (!entry.name.endsWith('.md')) continue;
    // A README is never a leaf: at the root it is the /dev index, inside a
    // folder it is that folder's index (attached above).
    if (entry.name === 'README.md') continue;

    pages.push(pageItem(full, rel));
  }

  // Folders first, then loose pages — matches the public docs sidebar.
  return [...folders, ...pages];
}

/** Build a Fumadocs page tree for the internal KB (sidebar). */
export function buildKBTree(): PageTree.Root {
  const dev = getDevDir();
  // No "back to docs" link: the notebook tab switcher above the sidebar owns
  // moving between the two roots.
  const children: PageTree.Node[] = [{ type: 'separator', name: 'kb/dev' }];

  if (fs.existsSync(dev)) {
    const readme = path.join(dev, 'README.md');
    if (fs.existsSync(readme)) {
      children.push({
        type: 'page',
        name: frontmatterTitle(readme) ?? 'Overview (README)',
        url: '/dev',
      });
    }
    children.push(...buildNodes(dev, ''));
  }

  return { name: 'Internal KB', children };
}

/** Resolve a /dev slug to a file inside kb/dev (traversal-safe). */
export function resolveKBFile(slug: string[] | undefined): string | null {
  const devDir = getDevDir();
  const rel = slug && slug.length > 0 ? slug.join('/') : 'README.md';
  const full = path.resolve(devDir, rel);
  if (!full.startsWith(path.resolve(devDir) + path.sep)) return null;
  if (!full.endsWith('.md') || !fs.existsSync(full)) return null;
  return full;
}
