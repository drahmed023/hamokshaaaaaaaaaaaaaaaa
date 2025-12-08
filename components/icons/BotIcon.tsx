
import React from 'react';

export function BotIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="14" x="3" y="8" rx="2" />
      <path d="M12 8V3" />
      <circle cx="12" cy="3" r="1.5" />
      <path d="M9 14h.01" strokeWidth="3" />
      <path d="M15 14h.01" strokeWidth="3" />
      <path d="M10 18c.5.5 1.5 1 2 1s1.5-.5 2-1" />
    </svg>
  );
}
