
import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import Button from '../components/Button';
import { useTasks } from '../hooks/useTasks';
import { Task, TasksActionType } from '../types';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';

function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const { tasks, dispatch } = useTasks();

  const eventsByDate = useMemo(() => {
    const events: { [key: string]: Task[] } = {};
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = task.dueDate;
        if (!events[dateKey]) {
          events[dateKey] = [];
        }
        events[dateKey].push(task);
      }
    });
    return events;
  }, [tasks]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();
  const today = new Date();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const isSameDay = (d1: Date, d2: Date | null) => {
    if (!d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = selectedDate.toISOString().split('T')[0];
    return eventsByDate[dateKey] || [];
  }, [selectedDate, eventsByDate]);

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Study Calendar</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Coordinate your study sessions and milestones.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calendar Main Grid */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800">
          <div className="flex justify-between items-center mb-8">
            <Button onClick={prevMonth} variant="secondary" size="sm" className="!p-2 rounded-xl">
              <ChevronLeftIcon className="w-6 h-6" />
            </Button>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <Button onClick={nextMonth} variant="secondary" size="sm" className="!p-2 rounded-xl">
              <ChevronRightIcon className="w-6 h-6" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {daysOfWeek.map(day => (
              <div key={day} className="pb-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {day}
              </div>
            ))}
            
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dateKey = date.toISOString().split('T')[0];
              const dayEvents = eventsByDate[dateKey] || [];
              const isSelected = isSameDay(date, selectedDate);
              const isTodayFlag = isSameDay(date, today);

              const hasPending = dayEvents.some(e => !e.completed);
              const hasCompleted = dayEvents.some(e => e.completed);

              return (
                <div key={day} className="aspect-square flex items-center justify-center">
                  <button
                    onClick={() => setSelectedDate(date)}
                    className={`relative w-full h-full max-w-[50px] max-h-[50px] rounded-2xl flex flex-col items-center justify-center transition-all duration-200 group
                      ${isSelected ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-110 z-10' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
                      ${!isSelected && isTodayFlag ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
                  >
                    <span className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                      {day}
                    </span>
                    
                    {/* Task Badge Indicators (Dots) */}
                    {!isSelected && (
                      <div className="absolute bottom-1.5 flex gap-1">
                        {hasPending && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 shadow-sm shadow-primary-500/50" />}
                        {hasCompleted && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-sm shadow-green-500/50" />}
                      </div>
                    )}
                    {isSelected && dayEvents.length > 0 && (
                      <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 min-h-[300px]">
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight">
              {selectedDate ? selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'Select Date'}
            </h3>
            
            <div className="space-y-4">
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map(task => (
                  <div key={task.id} className="group p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-start gap-4 transition-all hover:shadow-md">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => dispatch({ type: TasksActionType.TOGGLE_TASK, payload: task.id })}
                        className="w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-700 text-primary-600 focus:ring-primary-500/20 transition-all cursor-pointer"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className={`font-bold text-sm leading-tight break-words ${task.completed ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-800 dark:text-slate-100'}`}>
                        {task.text}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {/* Source Badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          task.source === 'study_plan' 
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 border-primary-100 dark:border-primary-900/30' 
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-800'
                        }`}>
                          {task.source === 'study_plan' && <ClipboardListIcon className="w-3 h-3" />}
                          {task.source === 'study_plan' ? 'Planner' : 'Manual'}
                        </span>
                        
                        {/* Status Badge */}
                        {task.completed && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-50 dark:bg-green-900/10 text-green-600 border border-green-100 dark:border-green-900/20">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                  <div className="p-4 bg-slate-200 dark:bg-slate-700 rounded-full mb-4">
                    <ClipboardListIcon className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-600">No scheduled tasks</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Card */}
          <div className="bg-primary-600 text-white p-6 rounded-[2rem] shadow-lg shadow-primary-600/20">
            <h4 className="font-black text-xs uppercase tracking-[0.2em] opacity-80 mb-4">Month Progress</h4>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-black">
                {tasks.filter(t => {
                  const d = t.dueDate ? new Date(t.dueDate) : null;
                  return d && d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear() && t.completed;
                }).length}
              </span>
              <span className="text-sm font-bold opacity-60 mb-1">Tasks Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarScreen;
