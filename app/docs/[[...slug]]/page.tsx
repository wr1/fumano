import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/page';
import { source } from '@/lib/source';
import { notFound } from 'next/navigation';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Mermaid } from '@/components/Mermaid';
import { hasKB, getDocFilePath } from '@/lib/kb';
import { githubFileUrl } from '@/lib/layout.shared';
import { PageActions } from '@/components/PageActions';
import { CommentsPanel } from '@/components/comments/CommentsPanel';
import { SelectionCommenter } from '@/components/comments/SelectionCommenter';

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) notFound();

  const MDX = page.data.body;

  // Stable on-disk path (relative to cwd) for this page's source file.
  // Used by the comments system for grouping + content hashing (sha).
  const file = getDocFilePath(page.path);

  const rich = hasKB();

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <PageActions
        markdownUrl={`/llms.mdx${page.url}`}
        githubUrl={githubFileUrl(file)}
      />
      <DocsBody>
        <div id="doc-content" data-fumadocs-content>
          <MDX components={{ ...defaultMdxComponents, Mermaid }} />
        </div>
      </DocsBody>

      {rich && (
        <>
          <CommentsPanel file={file} />
          <SelectionCommenter />
        </>
      )}
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
