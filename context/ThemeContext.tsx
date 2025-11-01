import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AccentColorName, ThemeName, BackgroundName, Font, ButtonShape, Mood } from '../types';

type ThemeContextType = {
  theme: ThemeName;
  toggleTheme: () => void;
  accentColor: AccentColorName;
  setAccentColor: (color: AccentColorName) => void;
  isAutoTheme: boolean;
  toggleAutoTheme: () => void;
  setThemeAndAccent: (theme: ThemeName, accent: AccentColorName) => void;
  background: BackgroundName;
  setBackground: (bg: BackgroundName) => void;
  font: Font;
  setFont: (font: Font) => void;
  buttonShape: ButtonShape;
  setButtonShape: (shape: ButtonShape) => void;
  focusMode: boolean;
  setFocusMode: (enabled: boolean) => void;
  mood: Mood;
  setMood: (mood: Mood) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// FIX: Changed from a const arrow function (React.FC) to a function declaration to resolve issues with the 'children' prop type in deeply nested contexts.
export function ThemeProvider({ children }: { children?: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>('light');
  const [accentColor, setAccentColor] = useState<AccentColorName>('indigo');
  const [background, setBackground] = useState<BackgroundName>('default');
  const [font, setFont] = useState<Font>('modern');
  const [buttonShape, setButtonShape] = useState<ButtonShape>('rounded');
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [mood, setMood] = useState<Mood>('neutral');
  const [isAutoTheme, setIsAutoTheme] = useState(false);

  const applyTheme = (t: ThemeName) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'calm');
    root.classList.add(t);
  };
  
  const applyAccentColor = (color: AccentColorName) => {
    const root = window.document.documentElement;
    root.setAttribute('data-accent', color);
  };
  
  const applyFont = (font: Font) => {
    document.documentElement.setAttribute('data-font', font);
  };

  useEffect(() => {
      const settings = JSON.parse(localStorage.getItem('themeSettings') || '{}');
      const { 
        theme: storedTheme, 
        accentColor: storedAccent, 
        isAutoTheme: storedAutoTheme, 
        background: storedBackground,
        font: storedFont,
        buttonShape: storedButtonShape,
        mood: storedMood,
      } = settings;

      setIsAutoTheme(storedAutoTheme ?? false);
      setAccentColor(storedAccent ?? 'indigo');
      setBackground(storedBackground ?? 'default');
      setFont(storedFont ?? 'modern');
      setButtonShape(storedButtonShape ?? 'rounded');
      setMood(storedMood ?? 'neutral');
      
      applyAccentColor(storedAccent ?? 'indigo');
      applyFont(storedFont ?? 'modern');
      
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e: MediaQueryListEvent) => {
          if (isAutoTheme) {
              const newTheme = e.matches ? 'dark' : 'light';
              setTheme(newTheme);
              applyTheme(newTheme);
          }
      };
      
      if (storedAutoTheme) {
          const systemTheme = prefersDark.matches ? 'dark' : 'light';
          setTheme(systemTheme);
          applyTheme(systemTheme);
      } else if (storedTheme) {
          setTheme(storedTheme);
          applyTheme(storedTheme);
      } else {
          setTheme('light');
          applyTheme('light');
      }
      
      prefersDark.addEventListener('change', handleSystemThemeChange);
      
      return () => {
          prefersDark.removeEventListener('change', handleSystemThemeChange);
      };

  }, [isAutoTheme]);
  
  const saveSettings = (settings: object) => {
    const currentSettings = JSON.parse(localStorage.getItem('themeSettings') || '{}');
    localStorage.setItem('themeSettings', JSON.stringify({ ...currentSettings, ...settings }));
  }

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      saveSettings({ theme: newTheme });
      applyTheme(newTheme);
      return newTheme;
    });
  };
  
  const handleSetAccentColor = (color: AccentColorName) => {
    setAccentColor(color);
    saveSettings({ accentColor: color });
    applyAccentColor(color);
  };

  const handleSetBackground = (bg: BackgroundName) => {
      setBackground(bg);
      saveSettings({ background: bg });
  };

  const handleSetFont = (f: Font) => {
    setFont(f);
    saveSettings({ font: f });
    applyFont(f);
  }

  const handleSetButtonShape = (shape: ButtonShape) => {
    setButtonShape(shape);
    saveSettings({ buttonShape: shape });
  }

  const handleSetMood = (m: Mood) => {
    setMood(m);
    saveSettings({ mood: m });
    // Future: Could apply theme changes based on mood
  };

  const toggleAutoTheme = () => {
      const newAutoState = !isAutoTheme;
      setIsAutoTheme(newAutoState);
      saveSettings({ isAutoTheme: newAutoState });
      if (newAutoState) {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          setTheme(systemTheme);
          applyTheme(systemTheme);
          saveSettings({ theme: systemTheme });
      }
  };
  
  const setThemeAndAccent = (newTheme: ThemeName, newAccent: AccentColorName) => {
      setTheme(newTheme);
      setAccentColor(newAccent);
      applyTheme(newTheme);
      applyAccentColor(newAccent);
      setIsAutoTheme(false); // Manual override disables auto-theme
      saveSettings({ theme: newTheme, accentColor: newAccent, isAutoTheme: false });
  }

  return (
    <ThemeContext.Provider value={{ 
      theme, toggleTheme, 
      accentColor, setAccentColor: handleSetAccentColor, 
      isAutoTheme, toggleAutoTheme, 
      setThemeAndAccent, 
      background, setBackground: handleSetBackground,
      font, setFont: handleSetFont,
      buttonShape, setButtonShape: handleSetButtonShape,
      focusMode, setFocusMode,
      mood, setMood: handleSetMood
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};