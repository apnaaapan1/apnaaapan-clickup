import { useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

export default function MoveListSpaceFlyout({
  anchorRef,
  anchorActiveKey,
  projects,
  sourceProjectId,
  moving,
  onSelectSpace,
}) {
  const [query, setQuery] = useState('');
  const [position, setPosition] = useState({ left: 0, top: 0 });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => (p.name || '').toLowerCase().includes(q));
  }, [projects, query]);

  useLayoutEffect(() => {
    const el = anchorRef?.current;
    if (!el) return undefined;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const width = Math.min(window.innerWidth - 24, 288);
      let left = rect.right + 8;
      let top = rect.top;

      if (left + width > window.innerWidth - 8) {
        left = rect.left - width - 8;
      }
      if (left < 8) left = 8;

      const maxH = Math.min(window.innerHeight * 0.7, 380);
      if (top + maxH > window.innerHeight - 8) {
        top = Math.max(8, window.innerHeight - maxH - 8);
      }
      if (top < 8) top = 8;

      setPosition({ left, top });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef, anchorActiveKey]);

  const panel = (
    <div
      data-move-list-flyout
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        zIndex: 10050,
      }}
      className="w-[min(calc(100vw-24px),288px)] rounded-xl border border-gray-200 bg-white shadow-xl flex flex-col max-h-[min(70vh,380px)]"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-2 pb-1 border-b border-gray-100">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-500" aria-hidden>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-lg border border-violet-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
            autoFocus
          />
        </div>
      </div>
      <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Spaces</p>
      <ul className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 space-y-0.5">
        {filtered.map((p) => {
          const isCurrent = String(p.id) === String(sourceProjectId);
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={moving || isCurrent}
                onClick={() => onSelectSpace(p.id)}
                className={`w-full flex items-center gap-2 rounded-lg px-2 py-2 text-left text-[15px] transition-colors min-w-0 ${
                  isCurrent
                    ? 'bg-violet-50 text-gray-900 cursor-default'
                    : 'hover:bg-gray-50 text-gray-800 disabled:opacity-50'
                }`}
              >
                <span className="w-8 h-8 shrink-0 rounded-lg bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center">
                  {(p.name || 'P').trim().charAt(0).toUpperCase()}
                </span>
                <span className="truncate flex-1 font-medium">{p.name}</span>
                {isCurrent ? (
                  <svg className="w-5 h-5 shrink-0 text-violet-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.082l-4-4a.75.75 0 011.06-1.06l3.346 3.345 7.426-9.695a.75.75 0 011.052-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : null}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 ? (
          <li className="px-2 py-4 text-sm text-center text-gray-500">No spaces match your search.</li>
        ) : null}
      </ul>
    </div>
  );

  return createPortal(panel, document.body);
}
