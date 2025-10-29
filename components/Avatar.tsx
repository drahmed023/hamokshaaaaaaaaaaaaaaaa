import React from 'react';
import { AvatarId } from '../types';
import { Avatar1 } from './avatars/Avatar1';
import { Avatar2 } from './avatars/Avatar2';
import { Avatar3 } from './avatars/Avatar3';
import { Avatar4 } from './avatars/Avatar4';
import { Avatar5 } from './avatars/Avatar5';
import { Avatar6 } from './avatars/Avatar6';

type AvatarProps = {
  avatarId: AvatarId;
  className?: string;
};

const AVATAR_MAP: Record<AvatarId, React.FC<React.SVGProps<SVGSVGElement>>> = {
  avatar1: Avatar1,
  avatar2: Avatar2,
  avatar3: Avatar3,
  avatar4: Avatar4,
  avatar5: Avatar5,
  avatar6: Avatar6,
};

export function Avatar({ avatarId, className }: AvatarProps) {
  const AvatarComponent = AVATAR_MAP[avatarId] || Avatar1;
  return <AvatarComponent className={className} />;
};
