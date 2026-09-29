import { llms } from 'fumadocs-core/source/llms';
import { source } from '@/lib/source';

// Public docs index for LLMs. kb/dev is internal and deliberately absent.
export const revalidate = false;

export async function GET() {
  return new Response(llms(source).index(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
