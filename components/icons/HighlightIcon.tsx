import React from 'react';

export function HighlightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m14.7 6.3-5.2 5.2c-.4.4-.4 1 0 1.4l2.6 2.6c.4.4 1 .4 1.4 0l5.2-5.2c.5-.5.5-1.2 0-1.7l-1.4-1.4c-.4-.5-1.2-.5-1.6 0Z" />
      <path d="m12 12 4.2 4.2" />
      <path d="M5 12v-2h11v2" />
      <path d="M4 18v-2h7v2" />
      <path d="M18 6h2v7" />
    </svg>
  );
}
