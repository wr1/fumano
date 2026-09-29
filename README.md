# DocKB (fumano)

A reusable documentation system for **docs-driven development** with excellent support for both humans and AI agents.

- Main documentation lives in `docs/` (Fumadocs + Next.js)
- Optional `kb/` layer enables rich mode:
  - `kb/comments/` — every comment is a flat timestamped JSON file
  - `kb/dev/` — internal developer knowledge base
- No sync step between layers ever.
- Agent-first design: direct filesystem operations for comments and internal notes.

## Quick Start

```bash
npm install
npm run dev
```

Visit http://localhost:3000/docs

To enable **rich mode** (commenting UI + internal KB):

**Important:** Run from the **project root** (directory containing your `docs/` folder). `kb/` must be a sibling of `docs/`, never inside `docs/kb`.

Treat `kb/` as its own git repo (recommended — see SKILL.md for details):

```bash
echo "kb/" >> .gitignore
mkdir -p kb/dev kb/comments
cd kb && git init && git add . && git commit -m "init kb repo" && cd ..
git add .gitignore && git commit -m "kb/ separate repo"
# restart dev server
```

## Use as a Template

1. Click **"Use this template"** on GitHub (or clone this repo).
2. Customize content under `docs/`.
3. (Optional) Add `kb/` **at the project root** (sibling to `docs/`, not inside it) for commenting and internal notes.
4. Deploy anywhere Next.js runs (self-hosted recommended for rich mode, since it writes to the filesystem).

## For Agents

Load the `fumano` skill (symlink or copy `SKILL.md` into your skills directory).

The skill contains complete recipes for:

- Discovering docs
- Creating properly formatted comments as JSON files
- Querying and resolving comments
- Knowing when to edit source vs. leave a comment

See also the rendered guide at `/docs/guides/agent-guide` once the site is running.

## Key Files

- `docs/` — public documentation source
- `kb/comments/*.json` — all comments (flat)
- `lib/actions.ts` — Server Actions that write comments
- `components/comments/CommentsPanel.tsx` — the UI (only shown in rich mode)
- `SKILL.md` — the primary agent skill definition
- `source.config.ts` — Fumadocs config (points at `docs/`)

## Philosophy

Clean public docs. Powerful private collaboration layer. Everything is files and git. Agents participate natively.

See `docs/reference/architecture.mdx` for the full rationale.


## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
