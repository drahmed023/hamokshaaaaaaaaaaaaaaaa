import React from 'react';

export function Avatar5(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" {...props}>
        <mask id="mask__beam" maskUnits="userSpaceOnUse" x="0" y="0" width="36" height="36">
            <rect width="36" height="36" rx="72" fill="#FFFFFF"></rect>
        </mask>
        <g mask="url(#mask__beam)">
            <rect width="36" height="36" fill="#BDBDBD"></rect>
            <rect x="0" y="0" width="36" height="36" transform="translate(5 5) rotate(90 18 18) scale(1)" fill="#E0E0E0" rx="36"></rect>
            <g transform="translate(5 -5) rotate(0 18 18)">
                <path d="M13,24 a1,1 0 0,0 10,0" fill="#000000"></path>
                <rect x="12" y="15" width="2.5" height="2.5" rx="1.25" stroke="none" fill="#000000"></rect>
                <rect x="21.5" y="15" width="2.5" height="2.5" rx="1.25" stroke="none" fill="#000000"></rect>
            </g>
        </g>
    </svg>
  );
}
