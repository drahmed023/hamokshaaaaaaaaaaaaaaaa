import { useTheme } from './useTheme';

// This hook is now a simple wrapper around useTheme for convenience
export const useAvatar = () => {
  const { avatarId, setAvatarId } = useTheme();
  return { avatarId, setAvatarId };
};
