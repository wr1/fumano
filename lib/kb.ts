import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import type { DocComment } from '@/lib/types';

/**
 * DocKB knowledge base detection and helpers.
 * All fs access is server-only.
 */

/**
 * Root of the project whose docs/ and kb/ are being served.
 *
 * Embedded install: the Next app lives in the project, cwd IS the root.
 * Shared runtime: one system-wide install serves any project — the `dockb`
 * launcher exports DOCKB_ROOT=<project root> and starts the server from the
 * runtime dir, so cwd would point at the runtime, not the content.
 */
export function projectRoot(): string {
  return process.env.DOCKB_ROOT || process.cwd();
}

export function hasKB(): boolean {
  // Static export is public docs only: /dev, comments, and llms routes are
  // stripped by dockb-export. Never report rich mode or the Dev KB tab would
  // ship as a dead link (e.g. GitHub Pages).
  if (process.env.DOCKB_STATIC_EXPORT === '1') return false;
  try {
    return fs.existsSync(path.join(projectRoot(), 'kb'));
  } catch {
    return false;
  }
}

export function getKBDir(): string {
  return path.join(projectRoot(), 'kb');
}

export function getCommentsDir(): string {
  return path.join(getKBDir(), 'comments');
}

export function getDevDir(): string {
  return path.join(getKBDir(), 'dev');
}

/**
 * Read every comment in kb/comments/, newest first.
 *
 * The directory is hand-editable and agents write to it too, so a single
 * malformed or half-written file must neither crash a render nor silently
 * empty the whole list — skip that file and keep the rest. Missing `tags` is
 * tolerated for the same reason: the renderers may map over it unguarded.
 */
export function readComments(): DocComment[] {
  const dir = getCommentsDir();
  if (!fs.existsSync(dir)) return [];

  const comments: DocComment[] = [];
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue;
    try {
      const parsed = JSON.parse(
        fs.readFileSync(path.join(dir, name), 'utf8'),
      ) as DocComment;
      comments.push({ ...parsed, tags: parsed.tags ?? [], timestamp: parsed.timestamp ?? '' });
    } catch {
      // Malformed comment file — ignore it rather than take down the page.
    }
  }

  return comments.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
}

/**
 * Generate a timestamped id matching the required format:
 * 2026-07-11T09-15-23Z_a3f2k9
 */
export function generateCommentId(): string {
  const iso = new Date().toISOString(); // 2026-07-11T09:15:23.123Z
  const stamp = iso.replace(/:/g, '-').slice(0, 19) + 'Z';
  const rand = randomBytes(3).toString('hex');
  return `${stamp}_${rand}`;
}

export function computeSha(relativeFile: string): string {
  const full = path.join(projectRoot(), relativeFile);
  const buf = fs.readFileSync(full);
  return createHash('sha1').update(buf).digest('hex').slice(0, 12);
}

export async function ensureCommentsDir(): Promise<void> {
  await fs.promises.mkdir(getCommentsDir(), { recursive: true });
}

export function getCommentFilePath(id: string): string {
  return path.join(getCommentsDir(), `${id}.json`);
}

/**
 * Locate a quote inside a source file and return its 1-based line range.
 *
 * Selection comments carry the quoted text, but the browser has no notion of
 * source line numbers — this anchors the quote server-side. Whitespace is
 * normalized so selections spanning soft-wrapped rendered lines still match
 * the source. Returns null when the quote cannot be found (edited file,
 * cross-element selection artifacts, hand-typed quotes).
 */
export function locateQuote(
  relativeFile: string,
  quote: string,
): { lineStart: number; lineEnd: number } | null {
  try {
    // The quote is RENDERED text; the source is markdown. Strip inline
    // markdown decorations and normalize whitespace on both sides so
    // "by **chordwise x**" matches a selection of "by chordwise x".
    const norm = (s: string) =>
      s
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images -> alt
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> text
        .replace(/[`*_~]/g, '')
        .replace(/^#{1,6}\s+/, '')
        .replace(/^>\s?/, '')
        .replace(/\s+/g, ' ')
        .trim();
    const q = norm(quote);
    if (!q) return null;

    const text = fs.readFileSync(path.join(projectRoot(), relativeFile), 'utf8');
    const lines = text.split('\n');

    // Normalized stream with a char -> source-line map.
    let stream = '';
    const lineOfChar: number[] = [];
    lines.forEach((line, i) => {
      const n = norm(line);
      if (!n) return;
      if (stream) {
        stream += ' ';
        lineOfChar.push(-1); // separator between source lines
      }
      for (let k = 0; k < n.length; k++) lineOfChar.push(i + 1);
      stream += n;
    });

    const idx = stream.indexOf(q);
    if (idx < 0) return null;

    const at = (j: number) =>
      lineOfChar[j] === -1 ? (lineOfChar[j + 1] ?? lineOfChar[j - 1]) : lineOfChar[j];
    const lineStart = at(idx);
    const lineEnd = at(idx + q.length - 1);
    if (!lineStart || !lineEnd) return null;
    return { lineStart, lineEnd };
  } catch {
    return null;
  }
}

/**
 * Derive the stable file identifier for a Fumadocs page (or any page path string).
 * Used for comments (grouping + sha snapshot of the source file).
 * Always returns a clean path like "docs/foo/bar.mdx" relative to project root.
 * Defensively strips repeated extensions and normalizes.
 */
export function getDocFilePath(pagePath: string | undefined): string {
  let p = pagePath || 'index';
  // Strip any number of trailing .md / .mdx extensions (defensive against double extension)
  p = p.replace(/(\.(mdx?|md))+$/i, '');
  return `docs/${p}.mdx`;
}
