import React from 'react';

export function TxtIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#f1f5f9" stroke="#64748b" />
      <polyline points="14 2 14 8 20 8" stroke="#64748b" />
      <line x1="16" y1="13" x2="8" y2="13" stroke="#94a3b8" />
      <line x1="16" y1="17" x2="8" y2="17" stroke="#94a3b8" />
    </svg>
  );
}
