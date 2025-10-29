import { useContext } from 'react';
import { SmartSettingsStateContext, SmartSettingsDispatchContext } from '../context/SmartSettingsContext';

export const useSmartSettings = () => {
  const state = useContext(SmartSettingsStateContext);
  const dispatch = useContext(SmartSettingsDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('useSmartSettings must be used within a SmartSettingsProvider');
  }
  return { ...state, dispatch };
};