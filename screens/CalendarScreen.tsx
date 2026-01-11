
import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import Button from '../components/Button';
import { useTasks } from '../hooks/useTasks';
import { Task, TasksActionType } from '../types';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { YouTubeIcon } from '../components/icons/YouTubeIcon';
import { LightbulbIcon } from '../components/icons/LightbulbIcon';
import { LinkIcon } from '../components/icons/LinkIcon';

function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const { tasks, dispatch } = useTasks();

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const eventsByDate = useMemo(() => {
    const events: { [key: string]: Task[] } = {};
    if (Array.isArray(tasks)) {
      tasks.forEach(task => {
        if (task.dueDate) {
          const dateKey = task.dueDate.includes('T') ? task.dueDate.split('T')[0] : task.dueDate;
          if (!events[dateKey]) events[dateKey] = [];
          events[dateKey].push(task);
        }
      });
    }
    return events;
  }, [tasks]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDate[formatDateKey(selectedDate)] || [];
  }, [selectedDate, eventsByDate]);

  return (
    <div className="max-w-5xl mx-auto pb-10 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Strategic Calendar</h1>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] mt-1">Coordinated Study Mission</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-8">
            <Button onClick={prevMonth} variant="secondary" size="sm" className="!p-2 rounded-xl"><ChevronLeftIcon className="w-6 h-6" /></Button>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
            <Button onClick={nextMonth} variant="secondary" size="sm" className="!p-2 rounded-xl"><ChevronRightIcon className="w-6 h-6" /></Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {daysOfWeek.map(day => <div key={day} className="pb-4 font-black text-[10px] uppercase text-slate-400">{day}</div>)}
            {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dateKey = formatDateKey(date);
              const isSelected = selectedDate && dateKey === formatDateKey(selectedDate);
              const hasEvents = !!eventsByDate[dateKey];
              const hasPlanEvents = eventsByDate[dateKey]?.some(e => e.source === 'study_plan');

              return (
                <div key={day} className="aspect-square flex items-center justify-center">
                  <button
                    onClick={() => setSelectedDate(date)}
                    className={`relative w-full h-full max-w-[45px] max-h-[45px] rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-primary-600 text-white shadow-lg scale-110' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <span className="text-sm font-black">{day}</span>
                    {hasEvents && !isSelected && (
                        <div className={`absolute bottom-1.5 w-1.5 h-1.5 rounded-full ${hasPlanEvents ? 'bg-indigo-500' : 'bg-slate-400'}`} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 min-h-[400px] flex flex-col">
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight border-b pb-2">
              {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Select Date'}
            </h3>
            
            <div className="flex-grow space-y-4">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map(task => (
                  <div key={task.id} className="p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 group transition-all hover:shadow-md">
                    <div className="flex items-start gap-3">
                        <input type="checkbox" checked={task.completed} onChange={() => dispatch({ type: TasksActionType.TOGGLE_TASK, payload: task.id })} className="w-5 h-5 mt-1 rounded-lg border-2 border-slate-200 text-primary-600 transition-colors" />
                        <div>
                            <p className={`font-bold text-sm leading-tight ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{task.text}</p>
                            {task.source === 'study_plan' && <span className="text-[8px] font-black uppercase text-indigo-500 tracking-widest mt-1 inline-block">Matrix Block</span>}
                        </div>
                    </div>
                    
                    {/* Rich Details for Study Plan Tasks */}
                    {task.source === 'study_plan' && (
                        <div className="space-y-2 mt-2 pt-2 border-t border-slate-50">
                            {task.tips && (
                                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
                                    <LightbulbIcon className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-[10px] font-bold text-amber-800 italic leading-relaxed">{task.tips}</p>
                                </div>
                            )}
                            {task.resources && task.resources.length > 0 && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1 px-1">
                                        <LinkIcon className="w-3 h-3 text-slate-400" />
                                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Resources</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        {task.resources.map((res, i) => (
                                            <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-2.5 py-1.5 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100">
                                                <YouTubeIcon className="w-3.5 h-3.5 text-rose-500" />
                                                <span className="text-[10px] font-black text-rose-600 truncate">{res.title}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                  <ClipboardListIcon className="w-12 h-12 text-slate-400 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No scheduled tasks</p>
                </div>
              )}
            </div>
            
            {selectedDate && (
                <Button variant="secondary" className="mt-6 w-full rounded-2xl h-12 border-dashed border-2 border-slate-200" onClick={() => {
                    const text = prompt("Quick task:");
                    if (text) dispatch({ type: TasksActionType.ADD_TASK, payload: { id: Date.now().toString(), text, completed: false, dueDate: formatDateKey(selectedDate), source: 'user' } });
                }}>
                    <PlusIcon className="w-5 h-5 mr-2" /> <span className="text-[10px] font-black uppercase tracking-widest">Add Quick Task</span>
                </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarScreen;
