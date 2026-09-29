import type { DocComment } from '@/lib/types';

export function CommentItem({ comment }: { comment: DocComment }) {
  const isResolved = comment.status === 'resolved';

  return (
    <div
      className={`rounded-lg border border-l-2 p-3 text-sm ${
        isResolved
          ? 'border-l-dockb-resolved opacity-60'
          : 'border-l-dockb-open'
      }`}
    >
      <div className="mb-1 flex items-center gap-2 text-xs text-fd-muted-foreground">
        <span className="font-mono">{comment.id}</span>
        <span>·</span>
        <span>{new Date(comment.timestamp).toLocaleString()}</span>
        <span>·</span>
        <span>{comment.author}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
            isResolved
              ? 'bg-dockb-resolved-bg text-dockb-resolved'
              : 'bg-dockb-open-bg text-dockb-open'
          }`}
        >
          {comment.status}
        </span>
      </div>

      {comment.quote ? (
        <blockquote className="mb-2 border-l-2 pl-2 text-fd-muted-foreground italic">
          “{comment.quote}”
          {(comment.lineStart || comment.lineEnd) && (
            <span className="not-italic text-[10px] ml-1">
              (L{comment.lineStart ?? '?'}-{comment.lineEnd ?? '?'})
            </span>
          )}
        </blockquote>
      ) : (comment.lineStart || comment.lineEnd) ? (
        <div className="mb-1 text-[10px] text-fd-muted-foreground">
          Lines {comment.lineStart ?? '?'}-{comment.lineEnd ?? '?'}
        </div>
      ) : null}

      <div className="whitespace-pre-wrap">{comment.comment}</div>

      {comment.tags && comment.tags.length > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {comment.tags.map((t) => (
            <span key={t} className="text-[10px] rounded bg-fd-muted px-1.5 py-px">#{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
