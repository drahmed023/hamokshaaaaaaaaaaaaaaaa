import React from 'react';

type ChartData = {
  day: string;
  correct: number;
  total: number;
};

type StackedBarChartProps = {
  data: ChartData[];
};

const StackedBarChart: React.FC<StackedBarChartProps> = ({ data }) => {
  const chartHeight = 160;
  const maxVal = Math.max(...data.map(d => d.total), 1); // Avoid division by zero

  return (
    <div className="w-full h-52 flex justify-around items-end gap-2 sm:gap-4 px-2">
      {data.map((item, index) => {
        const totalHeight = item.total > 0 ? Math.max((item.total / maxVal) * chartHeight, 4) : 0;
        const correctHeight = item.total > 0 ? (item.correct / item.total) * totalHeight : 0;
        const incorrectHeight = totalHeight - correctHeight;
        
        return (
          <div key={index} className="flex flex-col items-center flex-1 h-full justify-end" style={{minWidth: '20px'}}>
            <div
              className="relative w-full rounded-t-md cursor-pointer group"
              style={{ height: `${totalHeight}px` }}
            >
              <div className="absolute inset-0 flex flex-col justify-end">
                  <div
                    className="w-full bg-primary-800 dark:bg-primary-900 rounded-t-md group-hover:opacity-80 transition-opacity"
                    style={{ height: `${incorrectHeight}px` }}
                    title={`Incorrect: ${item.total - item.correct}`}
                  ></div>
                   <div
                    className="w-full bg-green-500 rounded-t-md group-hover:opacity-80 transition-opacity"
                    style={{ height: `${correctHeight}px` }}
                    title={`Correct: ${item.correct}`}
                  ></div>
              </div>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-2">{item.day}</span>
          </div>
        );
      })}
    </div>
  );
};

export default StackedBarChart;
