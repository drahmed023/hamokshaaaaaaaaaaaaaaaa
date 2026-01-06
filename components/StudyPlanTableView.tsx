import React from 'react';
import { StudyDay, StudyResource } from '../types';
import { YouTubeIcon } from './icons/YouTubeIcon';
import { PdfIcon } from './icons/PdfIcon';
import { LinkIcon } from './icons/LinkIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';

interface StudyPlanTableViewProps {
  title: string;
  createdDate: string;
  weeks: Array<{
    weekNumber: number;
    weeklyGoal: string;
    days: StudyDay[];
  }>;
}

const ResourceIcon = ({ type }: { type?: string }) => {
  const iconClass = "w-4 h-4";
  if (type?.toLowerCase().includes('youtube'))
    return <YouTubeIcon className={`${iconClass} text-red-600`} />;
  if (type?.toLowerCase().includes('pdf'))
    return <PdfIcon className={`${iconClass} text-orange-500`} />;
  if (type?.toLowerCase().includes('lecturio') || type?.toLowerCase().includes('amboss'))
    return <BookOpenIcon className={`${iconClass} text-blue-600`} />;
  return <LinkIcon className={`${iconClass} text-sky-500`} />;
};

const ResourceBadge: React.FC<{ resource: StudyResource }> = ({ resource }) => {
  const getLabel = (source?: string) => {
    if (!source) return 'Link';
    if (source.includes('YouTube')) return 'YouTube';
    if (source.includes('Scribd')) return 'Scribd';
    if (source.includes('AMBOSS')) return 'AMBOSS';
    if (source.includes('Lecturio')) return 'Lecturio';
    return source;
  };

  return (
    <div className="flex items-center gap-2 mt-1 text-xs">
      <ResourceIcon type={resource?.type} />
      <span className="text-slate-600 dark:text-slate-400 font-medium">
        {getLabel(resource?.source)}
      </span>
    </div>
  );
};

const DayColumn: React.FC<{ day: StudyDay; dayName: string; date: string }> = ({ day, dayName, date }) => {
  return (
    <div className={`flex-1 min-w-[140px] border-r border-slate-200 dark:border-slate-800 last:border-r-0 pb-6 ${day.isRestDay ? 'bg-slate-50/50 dark:bg-slate-900/30' : ''}`}>
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800 mb-4 sticky top-0 bg-white dark:bg-slate-950 z-10">
        <h4 className="font-bold text-slate-900 dark:text-white text-sm">
          {dayName}
        </h4>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          {date}
        </p>
      </div>

      <div className="px-4 space-y-5">
        {day.isRestDay ? (
          <div className="py-12 text-center">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider italic">Rest Day</p>
          </div>
        ) : (
          (day.tasks || []).map((task, idx) => (
            <div key={idx} className="space-y-2">
              <div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <div className="flex-grow">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                      {task.task}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {task.duration || 0} min
                    </p>
                  </div>
                </div>
              </div>

              {(task.resources || []).map((res, rIdx) => (
                <ResourceBadge key={rIdx} resource={res} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const StudyPlanTableView: React.FC<StudyPlanTableViewProps> = ({
  title,
  createdDate,
  weeks
}) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getMockDate = (dayIndex: number) => {
    const dates = ['Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9', 'Jan 10', 'Jan 11'];
    return dates[dayIndex % 7];
  };

  return (
    <div className="space-y-10">
      {weeks.map((week, wIdx) => (
        <div key={wIdx}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Week {week.weekNumber}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
              {week.weeklyGoal || 'Weekly objectives scheduled.'}
            </p>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
            <div className="overflow-x-auto">
              <div className="flex min-w-max md:min-w-full">
                {(week.days || []).map((day, dIdx) => (
                  <DayColumn
                    key={dIdx}
                    day={day}
                    dayName={daysOfWeek[dIdx % 7]}
                    date={getMockDate(dIdx)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
