import { notFound } from 'next/navigation';
import fs from 'node:fs';
import path from 'node:path';
import { DocsBody, DocsDescription, DocsPage } from 'fumadocs-ui/page';
import { createCompiler } from '@fumadocs/mdx-remote';
import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins/remark-mdx-mermaid';
import { Mermaid } from '@/components/Mermaid';
import { hasKB, getDevDir, readComments } from '@/lib/kb';
import { resolveKBFile } from '@/lib/kb-source';
import { PageActions } from '@/components/PageActions';
import { CommentsPanel } from '@/components/comments/CommentsPanel';
import { SelectionCommenter } from '@/components/comments/SelectionCommenter';

// kb/ is gitignored and changes at runtime — always render live.
// kb/dev is request-time only. Static public export uses force-static with no
// params (empty tree when kb/ is absent).
export const dynamic = 'force-dynamic';

const compiler = createCompiler({
  format: 'md',
  remarkPlugins: (v) => [remarkMdxMermaid, ...v],
});

// Absolutize relative links between kb files so they work from /dev too.
function KBLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const href = props.href ?? '';
  const fixed = /^([a-z]+:|\/|#)/i.test(href) ? href : `/dev/${href}`;
  return <a {...props} href={fixed} />;
}

function CommentQueue() {
  const comments = readComments();
  if (comments.length === 0) return null;
  const open = comments.filter((c) => c.status === 'open').length;

  return (
    <div className="mt-10 border-t pt-6 not-prose">
      <h2 className="mb-3 text-lg font-medium">
        Comment queue — kb/comments/{' '}
        <span className="text-sm font-normal text-fd-muted-foreground">
          ({open} open / {comments.length} total)
        </span>
      </h2>
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg border bg-fd-card p-4 text-sm">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span
                className={
                  c.status === 'open'
                    ? 'rounded-full bg-dockb-open-bg px-2 py-0.5 text-xs font-medium text-dockb-open'
                    : 'rounded-full bg-dockb-resolved-bg px-2 py-0.5 text-xs font-medium text-dockb-resolved'
                }
              >
                {c.status}
              </span>
              <code className="text-xs text-fd-muted-foreground">{c.file}</code>
              <span className="text-xs text-fd-muted-foreground">
                {c.author} · {c.timestamp.slice(0, 10)}
              </span>
              {c.tags.map((t) => (
                <span key={t} className="rounded bg-fd-muted px-1.5 py-0.5 text-xs">
                  {t}
                </span>
              ))}
            </div>
            {c.quote && (
              <blockquote className="my-1 border-l-2 pl-2 text-fd-muted-foreground">
                “{c.quote}”
              </blockquote>
            )}
            <p>{c.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DevKBPage(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  if (!hasKB()) notFound();

  const { slug } = await props.params;
  const full = resolveKBFile(slug);
  if (!full) notFound();

  const source = fs.readFileSync(full, 'utf8');
  const { body: MdxContent, toc } = await compiler.compile({
    source,
    filePath: full,
    components: { a: KBLink, Mermaid },
  });

  const isIndex = !slug || slug.length === 0;
  const rel = path.relative(getDevDir(), full);

  return (
    <DocsPage toc={toc}>
      {/* Colored so an internal page is never mistaken for a public one. */}
      <DocsDescription className="mb-4 font-mono text-xs">
        <span className="rounded bg-dockb-dev-bg px-1.5 py-0.5 text-dockb-dev">
          kb/dev/{rel}
        </span>{' '}
        — internal, rich mode only
      </DocsDescription>
      {/* No GitHub link: kb/ lives in its own gitignored repo. */}
      <PageActions markdownUrl={`/llms.mdx/dev/${rel}`} />
      <DocsBody>
        <div id="doc-content" data-fumadocs-content>
          <MdxContent />
        </div>
      </DocsBody>

      {isIndex && <CommentQueue />}
      <CommentsPanel file={`kb/dev/${rel}`} />
      <SelectionCommenter />
    </DocsPage>
  );
}
