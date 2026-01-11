
import { useAppData } from '../context/AppDataContext';
import { ThemeActionType, AccentColorName, ThemeName, BackgroundName, Font, ButtonShape, Mood, AvatarId, FontSize, ContainerWidth } from '../types';
import { useEffect } from 'react';

const ACCENT_COLOR_HEX: Record<AccentColorName, string> = {
    indigo: '#6366F1',
    sky: '#38BDF8',
    rose: '#F43F5E',
    emerald: '#10B981',
    orange: '#F97316',
    violet: '#8B5CF6',
    amber: '#F59E0B',
    teal: '#14B8A6',
    pink: '#EC4899',
    slate: '#64748B',
};

export const useTheme = () => {
  const { state, dispatch } = useAppData();
  const themeState = state.themeState;

  useEffect(() => {
    const root = window.document.documentElement;
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = themeState.isAutoTheme ? (prefersDark.matches ? 'dark' : 'light') : themeState.theme;

    root.classList.remove('light', 'dark', 'calm');
    root.classList.add(currentTheme);
    root.setAttribute('data-accent', themeState.accentColor);
    root.setAttribute('data-font', themeState.font);
    
    // Smooth custom variable application
    root.style.setProperty('--app-font-size', `${themeState.customFontSize}px`);
    const widthVal = themeState.containerWidth === 'full' ? '100%' : `${themeState.customContainerWidth}px`;
    root.style.setProperty('--app-container-width', widthVal);

    root.setAttribute('data-reduce-motion', String(themeState.reduceMotion));
  }, [themeState]);

  useEffect(() => {
    const favicon = document.getElementById('app-favicon') as HTMLLinkElement | null;
    if (favicon) {
        const color = ACCENT_COLOR_HEX[themeState.accentColor] || ACCENT_COLOR_HEX.indigo;
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="16" fill="${color}"/><path d="M32 48C26 48 22 44 22 39H27C27 41.5 29 43.5 32 43.5C35 43.5 37 42 37 39.5C37 37 35 36 32 35L28 34C23 32.5 20 29.5 20 25C20 20.5 24 17 32 17C38 17 41 20 42 24.5H37C36.5 22 34.5 21 32 21C29.5 21 28 22 28 24C28 26 30 27 32 27.5L36 28.5C41 30 44 33 44 38C44 43.5 39 48 32 48Z" fill="white"/></svg>`;
        favicon.href = `data:image/svg+xml,${encodeURIComponent(svgString)}`;
    }
  }, [themeState.accentColor]);

  const toggleTheme = () => dispatch({ type: ThemeActionType.TOGGLE_THEME });
  const setAccentColor = (color: AccentColorName) => dispatch({ type: ThemeActionType.SET_ACCENT_COLOR, payload: color });
  const setCustomFontSize = (size: number) => dispatch({ type: ThemeActionType.SET_CUSTOM_FONT_SIZE, payload: size });
  const setCustomContainerWidth = (width: number) => dispatch({ type: ThemeActionType.SET_CUSTOM_CONTAINER_WIDTH, payload: width });
  const setBackground = (bg: BackgroundName) => dispatch({ type: ThemeActionType.SET_BACKGROUND, payload: bg });
  const setFont = (font: Font) => dispatch({ type: ThemeActionType.SET_FONT, payload: font });
  const setContainerWidth = (width: ContainerWidth) => dispatch({ type: ThemeActionType.SET_CONTAINER_WIDTH, payload: width });
  const setButtonShape = (shape: ButtonShape) => dispatch({ type: ThemeActionType.SET_BUTTON_SHAPE, payload: shape });
  const setFocusMode = (enabled: boolean) => dispatch({ type: ThemeActionType.SET_FOCUS_MODE, payload: enabled });
  const setMood = (mood: Mood) => dispatch({ type: ThemeActionType.SET_MOOD, payload: mood });
  const setAvatarId = (id: AvatarId) => dispatch({ type: ThemeActionType.SET_AVATAR_ID, payload: id });
  const setPhoneNumber = (phone: string) => dispatch({ type: ThemeActionType.SET_PHONE_NUMBER, payload: phone });
  const setReduceMotion = (enabled: boolean) => dispatch({ type: ThemeActionType.SET_REDUCE_MOTION, payload: enabled });
  const toggleAutoTheme = () => dispatch({ type: ThemeActionType.TOGGLE_AUTO_THEME });

  return { 
      ...themeState, 
      toggleTheme, 
      setAccentColor, 
      setCustomFontSize,
      setCustomContainerWidth,
      setBackground,
      setFont,
      setContainerWidth,
      setButtonShape,
      setFocusMode,
      setMood,
      setAvatarId,
      setPhoneNumber,
      setReduceMotion,
      toggleAutoTheme
  };
};
