import React from 'react';

type BarChartProps = {
  data: { label: string; value: number }[];
  className?: string;
};

function BarChart({ data, className = '' }: BarChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-center text-slate-500 dark:text-slate-400 py-8">No data to display</div>;
  }

  const maxValue = Math.max(...data.map(d => d.value), 100); // Ensure max is at least 100 for percentage
  const chartHeight = 150;
  const barWidth = 30;
  const barMargin = 15;
  const chartWidth = data.length * (barWidth + barMargin);

  return (
    <div className={`flex justify-center items-end h-[150px] w-full overflow-x-auto ${className}`}>
      <svg width={chartWidth} height={chartHeight} aria-label="Exam scores chart">
        <g>
          {data.map((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = index * (barWidth + barMargin);
            const y = chartHeight - barHeight;
            const isPassing = item.value >= 50;

            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  className={isPassing ? 'fill-green-500' : 'fill-red-500'}
                  rx="4"
                  ry="4"
                />
                <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" className="text-xs font-semibold fill-slate-700 dark:fill-slate-200">
                  {Math.round(item.value)}%
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

export default BarChart;