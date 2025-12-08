
import React from 'react';

type CardProps = {
  children?: React.ReactNode;
  className?: string;
};

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700/80 overflow-hidden ${className}`}>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export default Card;
