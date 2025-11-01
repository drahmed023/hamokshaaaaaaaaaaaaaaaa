import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AvatarId } from '../types';

type AvatarContextType = {
  avatarId: AvatarId;
  setAvatarId: (id: AvatarId) => void;
};

export const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

// FIX: Changed from a const arrow function (React.FC) to a function declaration to resolve issues with the 'children' prop type in deeply nested contexts.
export function AvatarProvider({ children }: { children?: ReactNode }) {
  const [avatarId, setAvatarId] = useState<AvatarId>(() => {
    return (localStorage.getItem('avatarId') as AvatarId) || 'avatar1';
  });

  useEffect(() => {
    localStorage.setItem('avatarId', avatarId);
  }, [avatarId]);

  return (
    <AvatarContext.Provider value={{ avatarId, setAvatarId }}>
      {children}
    </AvatarContext.Provider>
  );
};