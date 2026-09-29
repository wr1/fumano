'use client';

import { useEffect, useState } from 'react';

interface Pos {
  top: number;
  left: number;
}

export function SelectionCommenter() {
  const [pos, setPos] = useState<Pos | null>(null);
  const [quote, setQuote] = useState('');

  useEffect(() => {
    const getContentRoot = () =>
      document.getElementById('doc-content') ||
      document.querySelector('.prose') ||
      document.querySelector('[data-fumadocs-content]') ||
      document.body;

    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      if (!text || text.length < 4) {
        setPos(null);
        return;
      }

      const root = getContentRoot();
      const anchor = selection?.anchorNode;

      // Only react to selections inside the main doc content
      if (!anchor || !root.contains(anchor)) {
        setPos(null);
        return;
      }

      try {
        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        if (rect.width < 10) {
          setPos(null);
          return;
        }

        // Position floating button above the selection (fixed = viewport coords)
        const top = rect.top - 38;
        const left = rect.left + rect.width / 2;

        setPos({ top, left });
        setQuote(text);
      } catch {
        setPos(null);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';

      if (!text || text.length < 4) return;

      const root = getContentRoot();
      if (!root.contains(e.target as Node)) return;

      // If there's a meaningful selection, hijack right-click to add comment
      e.preventDefault();
      window.dispatchEvent(
        new CustomEvent('fumano:add-comment', {
          detail: { quote: text },
        })
      );
      selection?.removeAllRanges();
      setPos(null);
    };

    // Hide on various interactions
    const hide = () => setPos(null);

    const handleMouseDown = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement;
      if (!target.closest('.selection-comment-btn')) {
        hide();
      }
    };

    // Keyboard escape
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('scroll', hide, true);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('scroll', hide, true);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!pos) return null;

  return (
    <div
      className="selection-comment-btn fixed z-[999] -translate-x-1/2 rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white shadow ring-1 ring-white/10 hover:bg-zinc-800 cursor-pointer select-none"
      style={{
        top: `${pos.top}px`,
        left: `${pos.left}px`,
      }}
      onClick={() => {
        if (quote) {
          window.dispatchEvent(
            new CustomEvent('fumano:add-comment', {
              detail: { quote },
            })
          );
        }
        setPos(null);
        window.getSelection()?.removeAllRanges();
      }}
      title="Add comment on this selection"
    >
      💬 Add comment
    </div>
  );
}
