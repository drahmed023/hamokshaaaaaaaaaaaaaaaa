
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { APP_NAME } from '../constants';
import { BarChartIcon } from './icons/BarChartIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { HomeIcon } from './icons/HomeIcon';
import { ListChecksIcon } from './icons/ListChecksIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { FolderIcon } from './icons/FolderIcon';
import { AppLogoIcon } from './icons/AppLogoIcon';
import { LinkIcon } from './icons/LinkIcon';
import { ImagePlusIcon } from './icons/ImagePlusIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { UserIcon } from './icons/UserIcon';
import { ClipboardListIcon } from './icons/ClipboardListIcon';
import { GraduationCapIcon } from './icons/GraduationCapIcon';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const navItems = [
  { to: '/', text: 'Home', icon: HomeIcon },
  { to: '/professor', text: "Dr. Zein's Arena", icon: GraduationCapIcon },
  { to: '/planner', text: 'Study Planner', icon: ClipboardListIcon },
  { to: '/profile', text: 'Profile', icon: UserIcon },
  { to: '/history', text: 'History', icon: BarChartIcon },
  { to: '/analytics', text: 'Analytics', icon: TrendingUpIcon },
  { to: '/achievements', text: 'Achievements', icon: TrophyIcon },
  { to: '/drive', text: 'Drive Files', icon: FolderIcon },
  { to: '/notion', text: 'Notion', icon: LinkIcon },
  { to: '/study-aids', text: 'Study Aids', icon: BookOpenIcon },
  { to: '/saved-items', text: 'Saved Items', icon: CheckCircleIcon },
  { to: '/bookmarks', text: 'Bookmarks', icon: BookmarkIcon },
  { to: '/explainer', text: 'AI Explainer', icon: LightbulbIcon },
  { to: '/diagram-explainer', text: 'Diagram Explainer', icon: ImagePlusIcon },
  { to: '/tasks', text: 'Tasks', icon: ListChecksIcon },
  { to: '/calendar', text: 'Calendar', icon: CalendarIcon },
  { to: '/settings', text: 'Settings', icon: SettingsIcon },
];

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navLinkClasses = "flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors icon-container";
  const activeLinkClasses = "bg-primary-100 dark:bg-slate-800 text-primary-700 dark:text-primary-400 shadow-sm";
  const inactiveLinkClasses = "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";
  
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;

  return (
    <>
      <div
        className={`hide-in-focus fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`hide-in-focus fixed top-0 left-0 h-full w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl z-50 border-r border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <Link id="sidebar-title" to="/" className="flex items-center gap-2 text-xl font-bold text-primary-700 dark:text-primary-400" onClick={onClose}>
            <AppLogoIcon className="w-6 h-6 icon-interactive" />
            <span>{APP_NAME}</span>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close navigation menu"
          >
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={getNavLinkClass} onClick={onClose} end={item.to === '/'}>
                <Icon className="w-5 h-5 icon-interactive" />
                <span>{item.text}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
