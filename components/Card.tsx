import React from 'react';

type CardProps = {
  children?: React.ReactNode;
  className?: string;
};

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white/70 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-slate-200/80 dark:border-slate-700/60 overflow-hidden ${className}`}>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export default Card;