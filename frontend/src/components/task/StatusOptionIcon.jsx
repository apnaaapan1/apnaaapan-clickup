export default function StatusOptionIcon({ status, color }) {
  if (status === 'done') {
    return (
      <span
        className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: color }}
      >
        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 16 16">
          <path d="M3 8l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (status === 'in_progress' || status === 'in_review') {
    return (
      <span
        className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: color }}
      >
        <span className="w-[7px] h-[7px] rounded-full" style={{ backgroundColor: color }} />
      </span>
    );
  }

  if (status === 'cancelled') {
    return (
      <span
        className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: color }}
      >
        <svg className="w-2.5 h-2.5" style={{ color }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 16 16">
          <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
        </svg>
      </span>
    );
  }

  return (
    <span
      className="w-[18px] h-[18px] rounded-full border-2 border-dashed shrink-0"
      style={{ borderColor: color }}
    />
  );
}
