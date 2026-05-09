/** Double chevron « collapse control for secondary sidebars (matches ClickUp-style rail). */
export default function SidebarCollapseButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      title="Collapse sidebar"
      aria-label="Collapse sidebar"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
      </svg>
    </button>
  );
}
