import { MarkdownCopyButton, ViewOptionsPopover } from 'fumadocs-ui/layouts/docs/page';

/**
 * "Copy Markdown" + "Open" (View as Markdown / ChatGPT / Claude / Cursor …).
 *
 * `markdownUrl` must serve the raw source of this page — see
 * `app/llms.mdx/[[...slug]]/route.ts`, which mirrors the page path.
 */
export function PageActions({
  markdownUrl,
  githubUrl,
}: {
  markdownUrl: string;
  githubUrl?: string;
}) {
  return (
    <div className="not-prose mb-6 flex flex-row items-center gap-2">
      <MarkdownCopyButton markdownUrl={markdownUrl} />
      <ViewOptionsPopover markdownUrl={markdownUrl} githubUrl={githubUrl} />
    </div>
  );
}
