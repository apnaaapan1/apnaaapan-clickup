import { NavLink } from 'react-router-dom';
import SidebarCollapseButton from './SidebarCollapseButton';

const navItemClass = ({ isActive }) =>
  `w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left text-gray-800 cursor-pointer ${
    isActive ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
  }`;

/**
 * Teams rail content for the white secondary sidebar (matches ClickUp-style Teams panel).
 */
export default function TeamsSecondarySidebar({
  memberCount,
  onCollapseSidebar,
}) {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-2 shrink-0">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Teams</h2>
        <SidebarCollapseButton onClick={onCollapseSidebar} />
      </div>

      <div className="px-4 py-4 flex-1 min-h-0 overflow-y-auto">
        <nav className="space-y-1 text-[14px]">
          <NavLink to="/teams/all" className={navItemClass}>
            <span className="text-base w-6 flex justify-center" aria-hidden>
              👥
            </span>
            All Teams
          </NavLink>
          <NavLink to="/teams/people" className={navItemClass}>
            <span className="text-base w-6 flex justify-center" aria-hidden>
              🪪
            </span>
            <span className="flex-1 truncate">All People</span>
            <span className="shrink-0 min-w-[1.5rem] h-6 px-1.5 rounded-full bg-gray-200 text-gray-800 text-xs font-semibold flex items-center justify-center">
              {memberCount}
            </span>
          </NavLink>
          <NavLink to="/teams/analytics" className={navItemClass}>
            <span className="text-base w-6 flex justify-center" aria-hidden>
              📶
            </span>
            Analytics
          </NavLink>
        </nav>

        <div className="my-5 border-t border-gray-200" />

        <p className="text-[13px] font-semibold text-gray-600 mb-3">My Teams</p>
        <div className="rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-8 text-center">
          <div
            className="w-9 h-9 mx-auto mb-3 rounded-lg bg-amber-300 shadow-inner"
            aria-hidden
          />
          <p className="text-sm text-gray-500 leading-relaxed">
            Once you are added to a Team you will see it here
          </p>
        </div>
      </div>
    </div>
  );
}


