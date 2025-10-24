import React, { useState, useEffect, useRef } from 'react';
import Button from './Button';

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak';

const POMODORO_TIME = 25 * 60;
const SHORT_BREAK_TIME = 5 * 60;
const LONG_BREAK_TIME = 15 * 60;

const PomodoroTimer: React.FC = () => {
    const [mode, setMode] = useState<TimerMode>('pomodoro');
    const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
    const [isActive, setIsActive] = useState(false);
    const [cycles, setCycles] = useState(0);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive]);

    useEffect(() => {
        if (timeLeft === 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsActive(false);

            if (mode === 'pomodoro') {
                const newCycles = cycles + 1;
                setCycles(newCycles);
                if (newCycles % 4 === 0) {
                    setMode('longBreak');
                    setTimeLeft(LONG_BREAK_TIME);
                } else {
                    setMode('shortBreak');
                    setTimeLeft(SHORT_BREAK_TIME);
                }
            } else {
                setMode('pomodoro');
                setTimeLeft(POMODORO_TIME);
            }
        }
    }, [timeLeft, mode, cycles]);
    
    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsActive(false);
        switch (mode) {
            case 'pomodoro': setTimeLeft(POMODORO_TIME); break;
            case 'shortBreak': setTimeLeft(SHORT_BREAK_TIME); break;
            case 'longBreak': setTimeLeft(LONG_BREAK_TIME); break;
        }
    };

    const switchMode = (newMode: TimerMode) => {
        setMode(newMode);
        setIsActive(false);
        switch (newMode) {
            case 'pomodoro': setTimeLeft(POMODORO_TIME); break;
            case 'shortBreak': setTimeLeft(SHORT_BREAK_TIME); break;
            case 'longBreak': setTimeLeft(LONG_BREAK_TIME); break;
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getModeText = () => {
        switch (mode) {
            case 'pomodoro': return 'Focus Time';
            case 'shortBreak': return 'Short Break';
            case 'longBreak': return 'Long Break';
        }
    }

    return (
        <div className="flex flex-col items-center gap-8 p-8 bg-white dark:bg-slate-800 rounded-xl shadow-lg">
            <div className="flex gap-2">
                <Button variant={mode === 'pomodoro' ? 'primary' : 'secondary'} onClick={() => switchMode('pomodoro')}>Focus</Button>
                <Button variant={mode === 'shortBreak' ? 'primary' : 'secondary'} onClick={() => switchMode('shortBreak')}>Short Break</Button>
                <Button variant={mode === 'longBreak' ? 'primary' : 'secondary'} onClick={() => switchMode('longBreak')}>Long Break</Button>
            </div>
            <div className="text-center">
                <p className="text-8xl font-bold tracking-tighter">{formatTime(timeLeft)}</p>
                <p className="text-slate-500 dark:text-slate-400 mt-2">{getModeText()}</p>
            </div>
            <div className="flex gap-4">
                <Button size="lg" onClick={toggleTimer}>
                    {isActive ? 'Pause' : 'Start'}
                </Button>
                <Button size="lg" variant="secondary" onClick={resetTimer}>
                    Reset
                </Button>
            </div>
             <p className="text-sm text-slate-500 dark:text-slate-400">Completed cycles: {cycles}</p>
        </div>
    );
};

export default PomodoroTimer;