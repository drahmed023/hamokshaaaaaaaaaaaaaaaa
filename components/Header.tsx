

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
// FIX: Import FireIcon to replace corrupted SVG
import { FireIcon } from './icons/FireIcon';

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
    <header className="hide-in-focus bg-white/80 dark:bg-slate-900/85 backdrop-blur-xl sticky top-0 z-30 border-b border-slate-200/80 dark:border-slate-700/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 icon-container"
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
                    {/* FIX: Replaced corrupted SVG with FireIcon component */}
                    <FireIcon className="w-5 h-5" />
                    {/* FIX: Display streak number */}
                    <span>{streak}</span>
                </div>
                {/* FIX: Reconstructed missing level progress bar */}
                <div className="w-24" title={`${xp}/${xpForNextLevel} XP`}>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-1 text-center font-semibold">
                        Level {level}
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                        <div className="h-2 bg-amber-400 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
              </div>
              {/* FIX: Reconstructed missing theme toggle button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-primary-500 icon-container"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <MoonIcon className="w-6 h-6 icon-interactive" />
                ) : (
                  <SunIcon className="w-6 h-6 icon-interactive" />
                )}
              </button>
              {/* FIX: Reconstructed missing user avatar link to settings */}
              <Link to="/settings" title="Settings">
                  <Avatar avatarId={avatarId} className="w-10 h-10 rounded-full" />
              </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

// FIX: Add default export to fix import error in App.tsx
export default Header;