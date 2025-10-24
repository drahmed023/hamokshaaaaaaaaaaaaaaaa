import React, { useState } from 'react';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import Button from '../components/Button';

const CalendarScreen: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

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
  
  const isToday = (day: number) => {
      return day === today.getDate() && 
             currentDate.getMonth() === today.getMonth() &&
             currentDate.getFullYear() === today.getFullYear();
  }

  return (
    <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Calendar</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Plan your study sessions and deadlines.</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <Button onClick={prevMonth} variant="secondary" size="sm"><ChevronLeftIcon /></Button>
                <h2 className="text-xl font-semibold">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h2>
                <Button onClick={nextMonth} variant="secondary" size="sm"><ChevronRightIcon /></Button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
                {daysOfWeek.map(day => (
                <div key={day} className="font-bold text-sm text-slate-500 dark:text-slate-400">{day}</div>
                ))}
                {Array.from({ length: startDay }).map((_, i) => (
                <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: totalDays }).map((_, i) => {
                    const day = i + 1;
                    return (
                        <div key={day} className={`p-2 rounded-full flex items-center justify-center ${isToday(day) ? 'bg-indigo-600 text-white' : ''}`}>
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};

export default CalendarScreen;