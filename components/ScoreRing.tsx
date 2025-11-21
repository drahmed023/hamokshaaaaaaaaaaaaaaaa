import React from 'react';

type ScoreRingProps = {
  score: number;
  size?: number;
  strokeWidth?: number;
};

const ScoreRing: React.FC<ScoreRingProps> = ({ score, size = 40, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const scoreColor = score >= 75 ? 'text-green-500' : score >= 40 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="absolute top-0 left-0" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-slate-200 dark:text-slate-700"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${scoreColor} transition-all duration-1000 ease-out`}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
        />
      </svg>
      <span className={`text-xs font-bold ${scoreColor}`}>{Math.round(score)}</span>
    </div>
  );
};

export default ScoreRing;
