'use server';

import { writeFile, readFile } from 'node:fs/promises';
import {
  hasKB,
  ensureCommentsDir,
  generateCommentId,
  computeSha,
  getCommentFilePath,
  getDocFilePath,
  locateQuote,
  readComments,
} from '@/lib/kb';
import type { DocComment, CreateCommentInput } from '@/lib/types';

/**
 * Create a new comment. Writes a flat JSON file to kb/comments/.
 * Only works when kb/ directory exists (rich mode).
 */
function normalizeCommentFile(file: string): string {
  if (file.startsWith('kb/')) return file;
  return getDocFilePath(file.replace(/^docs\//, ''));
}

export async function createComment(
  input: CreateCommentInput,
): Promise<DocComment> {
  if (!hasKB()) {
    throw new Error(
      'Rich mode required: create a kb/ directory (with kb/comments/) to enable commenting.',
    );
  }

  // Normalize to prevent bad filenames with double extensions etc.
  // Public docs pages go through getDocFilePath; kb/ files (the internal KB
  // is commentable too) are already stable identifiers — pass through.
  const normalizedFile = normalizeCommentFile(input.file);

  const id = generateCommentId();
  const timestamp = new Date().toISOString();
  const sha = computeSha(normalizedFile);

  // Selection comments carry a quote but no line numbers (the browser can't
  // know them) — anchor the quote to source lines server-side.
  const quote = input.quote || null;
  let lineStart = input.lineStart ?? null;
  let lineEnd = input.lineEnd ?? null;
  if (quote && lineStart == null) {
    const loc = locateQuote(normalizedFile, quote);
    if (loc) {
      lineStart = loc.lineStart;
      lineEnd = loc.lineEnd;
    }
  }

  const entry: DocComment = {
    id,
    timestamp,
    file: normalizedFile,
    repo: 'main',
    sha,
    quote,
    lineStart,
    lineEnd,
    comment: input.comment,
    author: input.author ?? 'anonymous',
    status: 'open',
    tags: input.tags ?? [],
    resolvedAt: null,
    resolvedBy: null,
  };

  await ensureCommentsDir();
  const filePath = getCommentFilePath(id);
  await writeFile(filePath, JSON.stringify(entry, null, 2), 'utf8');

  return entry;
}

/**
 * List comments, optionally filtered by file path.
 */
export async function listComments(file?: string): Promise<DocComment[]> {
  if (!hasKB()) return [];

  const all = readComments();
  if (!file) return all;

  const normalized = normalizeCommentFile(file);
  return all.filter((c) => c.file === normalized || c.file === file);
}

/**
 * Resolve (or change status of) a comment by id.
 * Simple read-modify-write. For agents and UI.
 */
export async function resolveComment(
  id: string,
  resolvedBy: string,
): Promise<DocComment> {
  if (!hasKB()) {
    throw new Error('Rich mode required');
  }

  const filePath = getCommentFilePath(id);
  const raw = await readFile(filePath, 'utf8');
  const entry = JSON.parse(raw) as DocComment;

  const updated: DocComment = {
    ...entry,
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
    resolvedBy,
  };

  await writeFile(filePath, JSON.stringify(updated, null, 2), 'utf8');
  return updated;
}
