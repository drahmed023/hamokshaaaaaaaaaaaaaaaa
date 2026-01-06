
import { useAppData } from '../context/AppDataContext';
import { ProfileActionType, ProfileState } from '../types';

export const useProfile = () => {
  const { state, dispatch } = useAppData();
  
  const updateProfile = (updates: Partial<ProfileState>) => {
    dispatch({ type: ProfileActionType.UPDATE_PROFILE, payload: updates });
  };

  return { ...state.profileState, updateProfile, dispatch };
};
