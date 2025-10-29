import React from 'react';
import { usePomodoro } from '../hooks/usePomodoro';

function CircularTimer() {
    const { state } = usePomodoro();
    const { timeLeft, mode, pomodoroDuration, shortBreakDuration, longBreakDuration } = state;

    const totalTime = mode === 'pomodoro' ? pomodoroDuration * 60 : mode === 'shortBreak' ? shortBreakDuration * 60 : longBreakDuration * 60;
    const progress = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const radius = 90;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative w-64 h-64">
            <svg className="w-full h-full" viewBox="0 0 200 200">
                <circle
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="100"
                    cy="100"
                />
                <circle
                    className="text-primary-600"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="100"
                    cy="100"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s linear' }}
                />
            </svg>
            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                <span className="text-5xl font-bold tracking-tighter text-slate-800 dark:text-slate-100">
                    {formatTime(timeLeft)}
                </span>
            </div>
        </div>
    );
};

export default CircularTimer;