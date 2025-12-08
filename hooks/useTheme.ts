import { useAppData } from '../context/AppDataContext';
import { ThemeActionType, AccentColorName, ThemeName, BackgroundName, Font, ButtonShape, Mood, AvatarId } from '../types';
import { useEffect } from 'react';

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