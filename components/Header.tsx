import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { HomeIcon } from './icons/HomeIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { APP_NAME } from '../constants';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const navLinkClasses = "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const activeLinkClasses = "bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400";
  const inactiveLinkClasses = "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";
  
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => 
    `${navLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`;

  return (
    <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600 dark:text-indigo-400">
            <SparklesIcon className="w-6 h-6" />
            <span>{APP_NAME}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <NavLink to="/" className={getNavLinkClass} end><HomeIcon className="w-5 h-5" />Home</NavLink>
            <NavLink to="/history" className={getNavLinkClass}><BarChartIcon className="w-5 h-5" />History</NavLink>
            <NavLink to="/study-aids" className={getNavLinkClass}><BookOpenIcon className="w-5 h-5" />Study Aids</NavLink>
            <NavLink to="/saved-items" className={getNavLinkClass}><CheckCircleIcon className="w-5 h-5" />Saved Items</NavLink>
            <NavLink to="/pomodoro" className={getNavLinkClass}><ClockIcon className="w-5 h-5" />Pomodoro</NavLink>
            <NavLink to="/tasks" className={getNavLinkClass}>Tasks</NavLink>
            <NavLink to="/calendar" className={getNavLinkClass}>Calendar</NavLink>
          </nav>
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;