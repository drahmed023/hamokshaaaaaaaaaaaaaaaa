import React from 'react';

export function Avatar3(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" {...props}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
            <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
        </mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#8E8E8E"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(3 7) rotate(30 18 18) scale(1.2)" fill="#b0b0b0" rx="6"></rect>
            <g transform="translate(6.5 -1) rotate(0 18 18)">
                <path d="M13,21 a2,2 0 0,0 10,0" fill="#FFFFFF"></path>
                <rect x="12" y="14" width="3" height="3" rx="1" stroke="none" fill="#FFFFFF"></rect>
                <rect x="21" y="14" width="3" height="3" rx="1" stroke="none" fill="#FFFFFF"></rect>
            </g>
        </g>
    </svg>
  );
}
