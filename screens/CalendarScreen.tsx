





import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import Button from '../components/Button';
import { useTasks } from '../hooks/useTasks';
import { Task, TasksActionType } from '../types';
import { ListChecksIcon } from '../components/icons/ListChecksIcon';
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
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Study Calendar</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Your tasks and study plan, all in one place.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            {/* Fix: Added children to Button component to resolve missing prop error. */}
            <Button onClick={prevMonth} variant="secondary" size="sm"><ChevronLeftIcon className="w-5 h-5" /></Button>
            <h2 className="text-xl font-semibold">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            {/* Fix: Added children to Button component to resolve missing prop error. */}
            <Button onClick={nextMonth} variant="secondary" size="sm"><ChevronRightIcon className="w-5 h-5" /></Button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {daysOfWeek.map(day => (
              <div key={day} className="font-bold text-sm text-slate-500 dark:text-slate-400">{day}</div>
            ))}
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const dateKey = date.toISOString().split('T')[0];
              const dayEvents = eventsByDate[dateKey] || [];
              const isSelected = isSameDay(date, selectedDate);
              const isTodayFlag = isSameDay(date, today);

              return (
                <div key={day} className="py-1">
                  <button
                    onClick={() => setSelectedDate(date)}
                    className={`w-10 h-10 rounded-full flex flex-col items-center justify-center transition-colors
                      ${isSelected ? 'bg-primary-600 text-white' : ''}
                      ${!isSelected && isTodayFlag ? 'text-primary-600 font-bold' : ''}
                      ${!isSelected ? 'hover:bg-slate-100 dark:hover:bg-slate-700' : ''}`}
                  >
                    <span>{day}</span>
                    <div className="flex gap-0.5 mt-1">
                      {dayEvents.slice(0, 3).map(event => (
                          <div key={event.id} className={`w-1 h-1 rounded-full ${event.completed ? (isSelected ? 'bg-white/50' : 'bg-green-500') : (isSelected ? 'bg-white' : 'bg-primary-500')}`}></div>
                      ))}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="md:col-span-1">
          <h3 className="text-xl font-bold mb-4">
            {selectedDate ? selectedDate.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Select a date'}
          </h3>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {selectedDateEvents.length > 0 ? (
              selectedDateEvents.map(task => (
                <div key={task.id} className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => dispatch({ type: TasksActionType.TOGGLE_TASK, payload: task.id })}
                    className="w-5 h-5 mt-1 rounded text-primary-600 focus:ring-primary-500"
                  />
                  <div>
                    <p className={`font-medium ${task.completed ? 'line-through text-slate-500' : ''}`}>{task.text}</p>
                    {task.source === 'study_plan' && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                        <ClipboardListIcon className="w-3 h-3" />
                        <span>From Study Plan</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400">No tasks scheduled for this day.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarScreen;