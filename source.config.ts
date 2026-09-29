import path from 'node:path';
import { defineDocs, defineConfig } from 'fumadocs-mdx/config';
import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins/remark-mdx-mermaid';

// Shared-runtime mode: DOCKB_ROOT points at the project whose docs/ we serve;
// without it (embedded install) the docs live next to this file.
export const docs = defineDocs({
  dir: path.join(process.env.DOCKB_ROOT || process.cwd(), 'docs'),
});

// ```mermaid fences become <Mermaid chart="..."/> on public docs pages, matching the
// kb/dev renderer. The component is supplied by the docs page's MDX components map.
export default defineConfig({
  mdxOptions: {
    remarkPlugins: (v) => [remarkMdxMermaid, ...v],
  },
});
