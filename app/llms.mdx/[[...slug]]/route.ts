import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { source } from '@/lib/source';
import { getDocFilePath, hasKB, projectRoot } from '@/lib/kb';
import { resolveKBFile } from '@/lib/kb-source';

// Serves the raw markdown source of a page, so "Copy Markdown" / "View as
// Markdown" / the Open-in-AI links have something to fetch. The URL mirrors the
// page path: /docs/guides/x -> /llms.mdx/docs/guides/x.
//
// kb/dev is gitignored and read from disk at request time. Public docs can be
// pre-rendered for static export.
export const dynamic = 'force-dynamic';

function resolveFile(slug: string[]): string | null {
  const [root, ...rest] = slug;

  if (root === 'dev') {
    if (!hasKB()) return null;
    return resolveKBFile(rest);
  }

  if (root === 'docs') {
    const page = source.getPage(rest);
    return page ? getDocFilePath(page.path) : null;
  }

  return null;
}

/** Pre-render raw markdown for every public docs page (static export). */
export function generateStaticParams() {
  return source.getPages().map((page) => {
    // page.url is like /docs/guides/x → slug ['docs', 'guides', 'x']
    const parts = page.url.split('/').filter(Boolean);
    return { slug: parts };
  });
}

export async function GET(
  _req: Request,
  props: { params: Promise<{ slug?: string[] }> },
) {
  const { slug = [] } = await props.params;
  const file = resolveFile(slug);
  if (!file) notFound();

  let content: string;
  try {
    // KB paths come back absolute; docs paths are project-root-relative.
    content = fs.readFileSync(
      path.isAbsolute(file) ? file : path.join(projectRoot(), file),
      'utf8',
    );
  } catch {
    notFound();
  }

  return new Response(content, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
