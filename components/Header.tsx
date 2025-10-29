import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { MenuIcon } from './icons/MenuIcon';
import { APP_NAME } from '../constants';
import { useGamification } from '../hooks/useGamification';
import { useAvatar } from '../hooks/useAvatar';
import { Avatar } from './Avatar';
import { AppLogoIcon } from './icons/AppLogoIcon';

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { level, xp, streak } = useGamification();
  const { avatarId } = useAvatar();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const xpForNextLevel = 100 * Math.pow(2, level - 1);
  const progress = Math.min((xp / xpForNextLevel) * 100, 100);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDateTime = currentDateTime.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <header className="hide-in-focus bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 icon-container"
              aria-label="Open navigation menu"
            >
              <MenuIcon className="w-6 h-6 icon-interactive" />
            </button>
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400">
              <AppLogoIcon className="w-6 h-6 icon-interactive" />
              <span className="hidden sm:inline">{APP_NAME}</span>
            </Link>
          </div>
          
          <div className="hidden md:flex flex-1 justify-center items-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {formattedDateTime}
            </p>
          </div>

          <div className="flex-1 flex justify-end items-center gap-4">
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2 text-orange-500 font-semibold" title={`${streak} day streak`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M14 3c7.2 0 10 3 10 9.5-1.5 6-10 9.5-10 9.5s-8.5-3.5-10-9.5C4 6 6.8 3 14 3z"/><path d="M14.5 9.5A2.5 2.5 0 0 1 17 12c0 2-2.5 4-2.5 4S12 14 12 12a2.5 2.5 0 0 1 2.5-2.5z"/></svg>
                    <span>{streak}</span>
                </div>
                 <div className="w-40">
                    <div className="flex justify-between text-sm font-semibold mb-1">
                        <span className="text-slate-800 dark:text-slate-100">Level {level}</span>
                        <span className="text-slate-500 dark:text-slate-400">{xp}/{xpForNextLevel}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div className="bg-primary-500 h-2 rounded-full transition-all duration-500" style={{width: `${progress}%`}}></div>
                    </div>
                </div>
              </div>

            <div className="w-10 h-10">
                <Avatar avatarId={avatarId} />
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 icon-container"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <MoonIcon className="w-6 h-6 icon-interactive" /> : <SunIcon className="w-6 h-6 icon-interactive" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;