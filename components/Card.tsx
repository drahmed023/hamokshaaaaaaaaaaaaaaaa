
import React from 'react';

type CardProps = {
  children?: React.ReactNode;
  className?: string;
  // FIX: Added onClick to CardProps to support clickable card components.
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  // FIX: Added dir to CardProps to support RTL layouts (e.g., for Arabic content).
  dir?: 'ltr' | 'rtl' | 'auto';
};

function Card({ children, className = '', onClick, dir }: CardProps) {
  return (
    <div 
      className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/80 overflow-hidden ${className}`}
      onClick={onClick}
      dir={dir}
    >
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export default Card;
