import { useContext } from 'react';
import { MusicStateContext, MusicDispatchContext } from '../context/MusicContext';
import { MusicActionType } from '../types';

export const useMusic = () => {
  const state = useContext(MusicStateContext);
  const dispatch = useContext(MusicDispatchContext);
  if (state === undefined || dispatch === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }

  return {
    ...state,
    setTrack: (trackId: string | null) => dispatch({ type: MusicActionType.SET_TRACK, payload: trackId }),
    togglePlay: () => dispatch({ type: MusicActionType.TOGGLE_PLAY }),
    setVolume: (volume: number) => dispatch({ type: MusicActionType.SET_VOLUME, payload: volume }),
  };
};