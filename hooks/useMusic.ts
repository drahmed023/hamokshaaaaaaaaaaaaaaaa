import { useAppData } from '../context/AppDataContext';
import { MusicActionType } from '../types';

export const useMusic = () => {
  const { state, dispatch } = useAppData();

  return {
    ...state.musicState,
    setTrack: (trackId: string | null) => dispatch({ type: MusicActionType.SET_TRACK, payload: trackId }),
    togglePlay: () => dispatch({ type: MusicActionType.TOGGLE_PLAY }),
    setVolume: (volume: number) => dispatch({ type: MusicActionType.SET_VOLUME, payload: volume }),
  };
};
