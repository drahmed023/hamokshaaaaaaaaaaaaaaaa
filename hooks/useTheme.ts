import { useAppData } from '../context/AppDataContext';
import { ThemeActionType, AccentColorName, ThemeName, BackgroundName, Font, ButtonShape, Mood, AvatarId } from '../types';
import { useEffect } from 'react';

const ACCENT_COLOR_HEX: Record<AccentColorName, string> = {
    indigo: '#6366F1',
    sky: '#38BDF8',
    rose: '#F43F5E',
    emerald: '#10B981',
    orange: '#F97316',
};

export const useTheme = () => {
  const { state, dispatch } = useAppData();
  const themeState = state.themeState;

  // This effect handles the logic that was previously in ThemeProvider
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Auto theme logic
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    if (themeState.isAutoTheme) {
        const systemTheme = prefersDark.matches ? 'dark' : 'light';
        if (themeState.theme !== systemTheme) {
            // Dispatch an action to sync state if needed, but for now just applying class is fine
        }
    }
    const currentTheme = themeState.isAutoTheme ? (prefersDark.matches ? 'dark' : 'light') : themeState.theme;

    root.classList.remove('light', 'dark', 'calm');
    root.classList.add(currentTheme);
    root.setAttribute('data-accent', themeState.accentColor);
    root.setAttribute('data-font', themeState.font);
    root.setAttribute('data-reduce-motion', String(themeState.reduceMotion));

  }, [themeState.theme, themeState.isAutoTheme, themeState.accentColor, themeState.font, themeState.reduceMotion]);

  // Effect for updating the favicon dynamically
  useEffect(() => {
    const favicon = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (favicon) {
        const color = ACCENT_COLOR_HEX[themeState.accentColor] || ACCENT_COLOR_HEX.indigo;
        
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="16" fill="${color}"/><path d="M32 48C26 48 22 44 22 39H27C27 41.5 29 43.5 32 43.5C35 43.5 37 42 37 39.5C37 37 35 36 32 35L28 34C23 32.5 20 29.5 20 25C20 20.5 24 17 32 17C38 17 41 20 42 24.5H37C36.5 22 34.5 21 32 21C29.5 21 28 22 28 24C28 26 30 27 32 27.5L36 28.5C41 30 44 33 44 38C44 43.5 39 48 32 48Z" fill="white"/></svg>`;
        
        favicon.href = `data:image/svg+xml,${encodeURIComponent(svgString)}`;
    }
  }, [themeState.accentColor]);


  // Re-create the API of the old useTheme hook using dispatch
  const toggleTheme = () => dispatch({ type: ThemeActionType.TOGGLE_THEME });
  const setAccentColor = (color: AccentColorName) => dispatch({ type: ThemeActionType.SET_ACCENT_COLOR, payload: color });
  const toggleAutoTheme = () => dispatch({ type: ThemeActionType.TOGGLE_AUTO_THEME });
  const setThemeAndAccent = (theme: ThemeName, accent: AccentColorName) => dispatch({ type: ThemeActionType.SET_THEME_AND_ACCENT, payload: { theme, accent } });
  const setBackground = (bg: BackgroundName) => dispatch({ type: ThemeActionType.SET_BACKGROUND, payload: bg });
  const setFont = (font: Font) => dispatch({ type: ThemeActionType.SET_FONT, payload: font });
  const setButtonShape = (shape: ButtonShape) => dispatch({ type: ThemeActionType.SET_BUTTON_SHAPE, payload: shape });
  const setFocusMode = (enabled: boolean) => dispatch({ type: ThemeActionType.SET_FOCUS_MODE, payload: enabled });
  const setMood = (mood: Mood) => dispatch({ type: ThemeActionType.SET_MOOD, payload: mood });
  const setAvatarId = (id: AvatarId) => dispatch({ type: ThemeActionType.SET_AVATAR_ID, payload: id });
  const setPhoneNumber = (phone: string) => dispatch({ type: ThemeActionType.SET_PHONE_NUMBER, payload: phone });
  const setReduceMotion = (enabled: boolean) => dispatch({ type: ThemeActionType.SET_REDUCE_MOTION, payload: enabled });
  
  return { 
      ...themeState, 
      toggleTheme, 
      setAccentColor, 
      toggleAutoTheme,
      setThemeAndAccent,
      setBackground,
      setFont,
      setButtonShape,
      setFocusMode,
      setMood,
      setAvatarId,
      setPhoneNumber,
      setReduceMotion,
  };
};