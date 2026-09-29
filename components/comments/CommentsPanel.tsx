'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { createComment, listComments, resolveComment } from '@/lib/actions';
import type { DocComment } from '@/lib/types';
import { CommentItem } from './CommentItem';

interface CommentsPanelProps {
  file: string; // e.g. "docs/getting-started.mdx" — the value from getDocFilePath()
}

export function CommentsPanel({ file }: CommentsPanelProps) {
  const [comments, setComments] = useState<DocComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const [form, setForm] = useState({
    quote: '',
    comment: '',
    lineStart: '',
    lineEnd: '',
    author: '',
    tags: '',
  });

  async function load() {
    setIsLoading(true);
    try {
      const data = await listComments(file);
      setComments(data.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)));
    } finally {
      setIsLoading(false);
    }
  }

  // Initial load (client only, safe)
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const trimmedQuote = form.quote.trim();
    const input = {
      file,
      quote: trimmedQuote || undefined,
      comment: form.comment.trim(),
      lineStart: form.lineStart ? parseInt(form.lineStart, 10) : undefined,
      lineEnd: form.lineEnd ? parseInt(form.lineEnd, 10) : undefined,
      author: form.author.trim() || undefined,
      tags: form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined,
    };

    if (!input.comment) {
      alert('Comment is required.');
      return;
    }

    startTransition(async () => {
      try {
        await createComment(input);
        setForm({ quote: '', comment: '', lineStart: '', lineEnd: '', author: '', tags: '' });
        setShowForm(false);
        await load();
      } catch (err: any) {
        alert(err.message || 'Failed to create comment');
      }
    });
  }

  // Ctrl+Enter (Windows/Linux) / Cmd+Enter (macOS) submits from any field.
  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isPending) {
        e.currentTarget.requestSubmit();
      }
    }
  }

  async function handleResolve(id: string) {
    const by = prompt('Resolved by (your name or agent id):', 'human') || 'human';
    startTransition(async () => {
      await resolveComment(id, by);
      await load();
    });
  }

  const openCount = comments.filter((c) => c.status === 'open').length;

  // Listen for selection-based "add comment" events (from SelectionCommenter)
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const quote = (e.detail?.quote || '').trim();
      if (quote) {
        setForm((prev) => ({ ...prev, quote }));
        setShowForm(true);
        // Scroll the comments section into view
        setTimeout(() => {
          const el = document.getElementById('comments-panel');
          el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
      }
    };

    window.addEventListener('fumano:add-comment', handler as EventListener);
    return () => window.removeEventListener('fumano:add-comment', handler as EventListener);
  }, []);

  // Auto-focus the comment textarea as soon as the form is shown
  // so the user can start typing immediately without clicking into the box.
  useEffect(() => {
    if (showForm && commentRef.current) {
      // Use requestAnimationFrame to ensure the textarea is in the DOM and focusable
      requestAnimationFrame(() => {
        commentRef.current?.focus();
      });
    }
  }, [showForm]);

  return (
    <div id="comments-panel" className="mt-10 border-t pt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="font-medium text-sm">
          Comments {openCount > 0 && <span className="text-dockb-open">({openCount} open)</span>}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-xs rounded border px-2 py-1 hover:bg-fd-muted"
        >
          {showForm ? 'Cancel' : '+ Add comment'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          className="mb-4 space-y-2 rounded-lg border bg-fd-card p-3 text-sm"
        >
          <input
            className="w-full rounded border bg-background px-2 py-1 font-mono text-xs"
            placeholder="Quote from the document (optional, exact text)"
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="rounded border bg-background px-2 py-1 text-xs"
              placeholder="Line start (optional)"
              value={form.lineStart}
              onChange={(e) => setForm({ ...form, lineStart: e.target.value })}
            />
            <input
              className="rounded border bg-background px-2 py-1 text-xs"
              placeholder="Line end (optional)"
              value={form.lineEnd}
              onChange={(e) => setForm({ ...form, lineEnd: e.target.value })}
            />
          </div>
          <textarea
            ref={commentRef}
            className="w-full rounded border bg-background px-2 py-1 text-sm min-h-[60px]"
            placeholder="Your comment or question..."
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="rounded border bg-background px-2 py-1 text-xs"
              placeholder="Author (optional)"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
            />
            <input
              className="rounded border bg-background px-2 py-1 text-xs"
              placeholder="tags (comma,separated)"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded bg-fd-primary px-3 py-1 text-sm text-fd-primary-foreground disabled:opacity-50"
          >
            {isPending ? 'Posting...' : 'Post comment'}
          </button>
          <p className="text-[10px] text-fd-muted-foreground">
            <kbd className="rounded border px-1 font-mono">Ctrl</kbd>+
            <kbd className="rounded border px-1 font-mono">Enter</kbd> to submit
            (or <kbd className="rounded border px-1 font-mono">⌘</kbd>+
            <kbd className="rounded border px-1 font-mono">Enter</kbd>). Comments
            are stored as flat JSON files in <code>kb/comments/</code>.
          </p>
        </form>
      )}

      {isLoading && comments.length === 0 ? (
        <div className="text-xs text-fd-muted-foreground">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="text-xs text-fd-muted-foreground">No comments yet on this page.</div>
      ) : (
        <div className="space-y-2">
          {comments.map((c) => (
            <div key={c.id} className="group relative">
              <CommentItem comment={c} />
              {c.status === 'open' && (
                <button
                  onClick={() => handleResolve(c.id)}
                  className="absolute right-2 top-2 hidden text-[10px] text-fd-muted-foreground hover:text-fd-foreground group-hover:block"
                >
                  resolve
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
