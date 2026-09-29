import fs from 'node:fs';
import path from 'node:path';
import { projectRoot } from '@/lib/kb';

/**
 * Project static assets. Next serves the runtime's own public/, but in
 * shared-runtime mode a project's figures and embeds live in
 * <DOCKB_ROOT>/public and would otherwise 404. This root catch-all picks up
 * whatever no static route claimed and serves it from the project's public/.
 * Embedded installs are unaffected: there public/ is cwd/public, which Next's
 * native static handling already serves ahead of dynamic routes.
 */
// Dynamic in dev (serves project public/). Static export copies the project's
// public/ into the runtime public/ before build, so this handler is unused.
export const dynamic = 'force-dynamic';

const MIME: Record<string, string> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.woff2': 'font/woff2',
};

// Static export: figures are copied into runtime public/ before build.
export function generateStaticParams() {
  return [] as { path: string[] }[];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  if (process.env.DOCKB_STATIC_EXPORT === '1') {
    return new Response('Not found', { status: 404 });
  }
  const { path: segments } = await params;
  const publicDir = path.join(projectRoot(), 'public');
  const file = path.resolve(publicDir, ...segments);
  if (!file.startsWith(publicDir + path.sep)) {
    return new Response('Not found', { status: 404 });
  }
  let body: Buffer;
  try {
    body = fs.readFileSync(file);
  } catch {
    return new Response('Not found', { status: 404 });
  }
  const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  return new Response(new Uint8Array(body), { headers: { 'Content-Type': type } });
}
