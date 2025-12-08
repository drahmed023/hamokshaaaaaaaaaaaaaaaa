import React from 'react';

export function AppLogoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 64 64" fill="none" {...props}>
      <rect width="64" height="64" rx="16" fill="currentColor"/>
      <path d="M32 48C26 48 22 44 22 39H27C27 41.5 29 43.5 32 43.5C35 43.5 37 42 37 39.5C37 37 35 36 32 35L28 34C23 32.5 20 29.5 20 25C20 20.5 24 17 32 17C38 17 41 20 42 24.5H37C36.5 22 34.5 21 32 21C29.5 21 28 22 28 24C28 26 30 27 32 27.5L36 28.5C41 30 44 33 44 38C44 43.5 39 48 32 48Z" fill="white"/>
    </svg>
  );
}