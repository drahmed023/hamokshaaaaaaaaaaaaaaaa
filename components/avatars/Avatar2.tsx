import React from 'react';

export function Avatar2(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" {...props}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
            <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
        </mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#A0A0A0"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(6 6) rotate(10 18 18) scale(1.2)" fill="#C2C2C2" rx="36"></rect>
            <g transform="translate(4 -4) rotate(0 18 18)">
                <path d="M15 21c2 1 4 1 6 0" stroke="#FFFFFF" fill="none" strokeLinecap="round"></path>
                <rect x="12" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
                <rect x="22" y="14" width="1.5" height="2" rx="1" stroke="none" fill="#FFFFFF"></rect>
            </g>
        </g>
    </svg>
  );
}
