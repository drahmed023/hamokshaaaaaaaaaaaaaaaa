import React from 'react';

type CardProps = {
  children?: React.ReactNode;
  className?: string;
};

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white/20 dark:bg-slate-800/40 backdrop-blur-lg rounded-2xl shadow-lg border border-white/30 dark:border-slate-700/50 overflow-hidden ${className}`}>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export default Card;