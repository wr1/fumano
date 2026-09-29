export type CommentStatus = 'open' | 'resolved' | 'archived';

export interface DocComment {
  id: string;                    // e.g. 2026-07-11T09-15-23Z_a3f2k9
  timestamp: string;             // ISO string
  file: string;                  // e.g. "docs/getting-started.mdx" (stable identifier)
  repo: string;                  // e.g. "main"
  sha: string;                   // short content hash at time of comment
  quote: string | null;
  lineStart: number | null;
  lineEnd: number | null;
  comment: string;
  author: string;
  status: CommentStatus;
  tags: string[];
  resolvedAt: string | null;
  resolvedBy: string | null;
}

export interface CreateCommentInput {
  file: string;
  quote?: string;
  comment: string;
  lineStart?: number;
  lineEnd?: number;
  author?: string;
  tags?: string[];
}
