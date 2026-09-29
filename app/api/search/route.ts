import fs from 'node:fs';
import path from 'node:path';
import {
  createFromSource,
  initAdvancedSearch,
  type AdvancedIndex,
  type SearchServer,
} from 'fumadocs-core/search/server';
import { structure } from 'fumadocs-core/mdx-plugins';
import { source } from '@/lib/source';
import { hasKB, getDevDir } from '@/lib/kb';
import { listKBFiles, kbFileTitle, kbBreadcrumbs } from '@/lib/kb-source';

// The kb/dev half of the index is built from files that change at runtime,
// so this route must not be cached in dev. Static export freezes docs-only index.
export const dynamic = 'force-dynamic';

// Public docs: indexed by Fumadocs at module load — they only change on rebuild.
const docs = createFromSource(source);

/**
 * kb/dev is gitignored and edited while the server runs, and Orama builds its
 * database once per server instance — so the KB half of the index is kept in a
 * cache that is thrown away whenever a KB file is added, removed, or edited.
 * Re-indexing on every keystroke would be far too expensive; the search dialog
 * queries on each one.
 */
let cached: { key: string; server: SearchServer } | null = null;

function kbKey(): string {
  const dir = getDevDir();
  return listKBFiles()
    .map((rel) => {
      const { mtimeMs, size } = fs.statSync(path.join(dir, rel));
      return `${rel}:${mtimeMs}:${size}`;
    })
    .join('|');
}

function kbIndexes(): AdvancedIndex[] {
  const dir = getDevDir();

  return listKBFiles().map((rel) => {
    // Must match the URLs buildKBTree() puts in the sidebar, or results 404.
    const url = rel === 'README.md' ? '/dev' : `/dev/${rel}`;

    return {
      id: url,
      url,
      // Same title and folder path the sidebar shows, so a hit reads the same
      // way in search as it does in the tree.
      title: kbFileTitle(rel),
      breadcrumbs: kbBreadcrumbs(rel),
      structuredData: structure(fs.readFileSync(path.join(dir, rel), 'utf8')),
    };
  });
}

function kbServer(): SearchServer {
  const key = kbKey();
  if (cached?.key !== key) {
    cached = { key, server: initAdvancedSearch({ indexes: kbIndexes() }) };
  }
  return cached.server;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get('query');
  if (!query) return Response.json([]);

  const results = await docs.search(query);
  if (!hasKB()) return Response.json(results);

  return Response.json([...results, ...(await kbServer().search(query))]);
}
