import React from 'react';

type CardProps = {
  children?: React.ReactNode;
  className?: string;
};

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export default Card;