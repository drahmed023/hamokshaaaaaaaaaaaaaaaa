import React from 'react';

export function Avatar6(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" {...props}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
            <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
        </mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#616161"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(1 9) rotate(20 18 18) scale(1.1)" fill="#9e9e9e" rx="36"></rect>
            <g transform="translate(5 -3) rotate(0 18 18)">
                <path d="M14 21c1.33-1.33 5.33-1.33 6.66 0" stroke="#FFFFFF" fill="none" strokeLinecap="round"></path>
                <rect x="13" y="14" width="2.5" height="2.5" rx="1" stroke="none" fill="#FFFFFF"></rect>
                <rect x="20.5" y="14" width="2.5" height="2.5" rx="1" stroke="none" fill="#FFFFFF"></rect>
            </g>
        </g>
    </svg>
  );
}
