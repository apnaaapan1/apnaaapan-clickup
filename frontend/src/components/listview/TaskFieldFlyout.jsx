import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function TaskFieldFlyout({ anchorRef, open, dataAttr, width = 260, children }) {
  const [position, setPosition] = useState({ left: 0, top: 0 });

  useLayoutEffect(() => {
    const el = anchorRef?.current;
    if (!open || !el) return undefined;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const panelWidth = Math.min(window.innerWidth - 16, width);
      let left = rect.left + rect.width / 2 - panelWidth / 2;
      let top = rect.bottom + 6;

      if (left + panelWidth > window.innerWidth - 8) {
        left = window.innerWidth - panelWidth - 8;
      }
      if (left < 8) left = 8;

      const maxH = 320;
      if (top + maxH > window.innerHeight - 8) {
        top = Math.max(8, rect.top - maxH - 6);
      }

      setPosition({ left, top });
    };

    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [anchorRef, open, width]);

  if (!open) return null;

  return createPortal(
    <div
      {...{ [dataAttr]: true }}
      style={{
        position: 'fixed',
        left: position.left,
        top: position.top,
        zIndex: 10040,
        width: Math.min(window.innerWidth - 16, width),
      }}
      className="rounded-xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] text-[13px] text-gray-900 antialiased overflow-hidden"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}
