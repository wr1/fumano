import path from 'node:path';
import { createHash } from 'node:crypto';
import type { NextConfig } from 'next';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/**
 * Hosts allowed to request dev-only `/_next/*` resources.
 *
 * Opening the dev server on a LAN address instead of localhost otherwise gets
 * those requests a 403, which stops the client bundle from hydrating. The page
 * still server-renders and looks correct, but every client component goes dead
 * — including the comment panel and selection commenting, whose buttons then
 * silently do nothing. Allow the private ranges so browsing from another
 * machine on the network behaves like localhost.
 *
 * Matching is segment-wise with `*` wildcards, so IP globs work. Override with
 * DOCKB_DEV_ORIGINS (comma-separated) for anything else.
 */
const devOrigins = process.env.DOCKB_DEV_ORIGINS
  ? process.env.DOCKB_DEV_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)
  : ['192.168.*.*', '10.*.*.*', '172.16.*.*', '127.0.0.1'];

/**
 * Shared-runtime mode: one installed copy of this app serves many projects
 * (DOCKB_ROOT=<project> set by the `dockb` launcher). Each project gets its own
 * build/dev cache dir — a shared .next holds compiled pages from whichever
 * project ran last, and stale-cache symptoms are nasty to diagnose.
 */
const distDir =
  process.env.DOCKB_DIST_DIR ||
  (process.env.DOCKB_ROOT
    ? `.next-projects/${path.basename(process.env.DOCKB_ROOT)}-${createHash('sha1')
        .update(process.env.DOCKB_ROOT)
        .digest('hex')
        .slice(0, 8)}`
    : '.next');

/**
 * Turbopack refuses to resolve modules outside its workspace root, and in
 * shared-runtime mode the generated .source collection imports the project's
 * docs files from wherever DOCKB_ROOT points. Widen the root to the deepest
 * directory containing both the runtime and the project.
 */
function commonAncestor(a: string, b: string): string {
  const as = a.split(path.sep);
  const bs = b.split(path.sep);
  let i = 0;
  while (i < as.length && i < bs.length && as[i] === bs[i]) i++;
  return as.slice(0, i).join(path.sep) || path.sep;
}

const staticExport = process.env.DOCKB_STATIC_EXPORT === '1';
const basePath = process.env.DOCKB_BASE_PATH || '';

/** @type {import('next').NextConfig} */
const config: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: devOrigins,
  distDir,
  // Plain static HTML for shipping / GitHub Pages (no Node server).
  // Set DOCKB_STATIC_EXPORT=1 and optional DOCKB_BASE_PATH=/repo-name.
  ...(staticExport
    ? {
        output: 'export' as const,
        images: { unoptimized: true },
        trailingSlash: true,
        // Shared runtime tsconfig accumulates every project's .next-projects
        // types; they conflict under static export. Docs MDX is already
        // compiled — skip the global typecheck for the export path.
        typescript: { ignoreBuildErrors: true },
        ...(basePath
          ? {
              basePath,
              assetPrefix: basePath.endsWith('/')
                ? basePath.slice(0, -1)
                : basePath,
            }
          : {}),
      }
    : {}),
  ...(process.env.DOCKB_ROOT
    ? {
        turbopack: {
          root: commonAncestor(__dirname, path.resolve(process.env.DOCKB_ROOT)),
        },
        // With the widened root, Turbopack's persistent filesystem cache
        // indexes everything under the common ancestor (≈ the whole home dir)
        // and grows by gigabytes per served project. In-memory compilation is
        // plenty for a docs site — keep the disk cache off in runtime mode.
        experimental: {
          turbopackFileSystemCacheForDev: false,
          turbopackFileSystemCacheForBuild: false,
        },
      }
    : {}),
};

export default withMDX(config);
