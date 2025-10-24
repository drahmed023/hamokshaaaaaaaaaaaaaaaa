import React from 'react';
import PomodoroTimer from '../components/PomodoroTimer';

const PomodoroScreen: React.FC = () => {
    return (
        <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Use this technique to break down work into focused intervals.</p>
            </div>
            <PomodoroTimer />
        </div>
    );
};

export default PomodoroScreen;