
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { useProfile } from '../hooks/useProfile';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { MenuIcon } from './icons/MenuIcon';
import { APP_NAME } from '../constants';
import { useGamification } from '../hooks/useGamification';
import { useAvatar } from '../hooks/useAvatar';
import { Avatar } from './Avatar';
import { AppLogoIcon } from './icons/AppLogoIcon';
import { FireIcon } from './icons/FireIcon';

interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { level, xp, streak } = useGamification();
  const { avatarId } = useAvatar();
  const { profilePicture } = useProfile();
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
    <header className="hide-in-focus bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 icon-container"
              aria-label="Open navigation menu"
            >
              <MenuIcon className="w-6 h-6 icon-interactive" />
            </button>
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-700 dark:text-primary-400">
              <AppLogoIcon className="w-6 h-6 icon-interactive" />
              <span className="hidden sm:inline">{APP_NAME}</span>
            </Link>
          </div>
          
          <div className="hidden md:flex flex-1 justify-center items-center">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap">
              {formattedDateTime}
            </p>
          </div>

          <div className="flex-1 flex justify-end items-center gap-4">
              <div className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500 font-bold" title={`${streak} day streak`}>
                    <FireIcon className="w-5 h-5" />
                    <span>{streak}</span>
                </div>
                <div className="w-24" title={`${xp}/${xpForNextLevel} XP`}>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mb-1 text-center font-bold">
                        Level {level}
                    </div>
                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full border border-slate-300 dark:border-slate-600">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 icon-container"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? (
                  <MoonIcon className="w-6 h-6 icon-interactive" />
                ) : (
                  <SunIcon className="w-6 h-6 icon-interactive" />
                )}
              </button>
              <Link to="/profile" title="Profile">
                  {profilePicture ? (
                      <img src={profilePicture} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm object-cover" alt="Profile" />
                  ) : (
                      <Avatar avatarId={avatarId} className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-sm" />
                  )}
              </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
