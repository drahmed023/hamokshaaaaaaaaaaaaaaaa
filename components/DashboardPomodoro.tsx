





import React, { useState, useEffect } from 'react';
import { usePomodoro } from '../hooks/usePomodoro';
import { PomodoroActionType, TimerMode } from '../types';
import { getMotivationalMessage } from '../services/geminiService';
import Card from './Card';
import Button from './Button';
import { ClockIcon } from './icons/ClockIcon';
import { SparklesIcon } from './icons/SparklesIcon';

function DashboardPomodoro() {
  const { state, dispatch } = usePomodoro();
  const [quote, setQuote] = useState({ text: '', date: '' });

  useEffect(() => {
    const fetchQuote = async () => {
      const today = new Date().toISOString().split('T')[0];
      try {
        const storedQuote = JSON.parse(localStorage.getItem('dailyQuote') || '{}');
        if (storedQuote.date === today && storedQuote.text) {
          setQuote(storedQuote);
        } else {
          const newQuoteText = await getMotivationalMessage();
          const newQuote = { text: newQuoteText, date: today };
          localStorage.setItem('dailyQuote', JSON.stringify(newQuote));
          setQuote(newQuote);
        }
      } catch (error) {
        console.error("Failed to get motivational quote:", error);
        setQuote({ text: "Every expert was once a beginner. Keep going!", date: today });
      }
    };
    fetchQuote();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const switchMode = (mode: TimerMode) => {
    if (state.isActive) {
      if (window.confirm('This will stop the current session. Are you sure?')) {
        dispatch({ type: PomodoroActionType.SET_MODE, payload: mode });
      }
    } else {
      dispatch({ type: PomodoroActionType.SET_MODE, payload: mode });
    }
  };

  const cyclesInSet = 4;
  const completedInSet = state.cycles % cyclesInSet;

  return (
    // Fix: Added children to Card component to resolve missing prop error.
    <Card className="w-full max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Timer Display */}
        <div className="flex flex-col items-center justify-center md:border-r md:border-slate-200 md:dark:border-slate-700 md:pr-6">
          <p className="text-6xl font-bold tracking-tighter text-slate-800 dark:text-slate-100">{formatTime(state.timeLeft)}</p>
          <div className="flex gap-2 mt-2">
            {/* Fix: Added children to Button components to resolve missing prop errors. */}
            <Button size="sm" variant={state.mode === 'pomodoro' ? 'primary' : 'secondary'} onClick={() => switchMode('pomodoro')}>Focus</Button>
            <Button size="sm" variant={state.mode === 'shortBreak' ? 'primary' : 'secondary'} onClick={() => switchMode('shortBreak')}>Short Break</Button>
            <Button size="sm" variant={state.mode === 'longBreak' ? 'primary' : 'secondary'} onClick={() => switchMode('longBreak')}>Long Break</Button>
          </div>
          <div className="flex gap-4 mt-4">
            {/* Fix: Added children to Button components to resolve missing prop errors. */}
            <Button onClick={() => dispatch({ type: PomodoroActionType.TOGGLE_ACTIVE })} size="lg" className="w-32">{state.isActive ? 'Pause' : 'Start'}</Button>
            <Button onClick={() => dispatch({ type: PomodoroActionType.RESET })} variant="secondary" size="lg">Reset</Button>
          </div>
        </div>

        {/* Stats & Progress */}
        <div className="flex flex-col justify-center text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <ClockIcon className="w-5 h-5 text-primary-500"/>
            <h3 className="text-lg font-semibold">Today's Focus</h3>
          </div>
          <p className="text-4xl font-bold mt-2">{state.sessionsToday}</p>
          <p className="text-slate-500 dark:text-slate-400">Pomodoros Completed</p>

          <div className="mt-4">
            <p className="text-sm font-medium mb-1">Cycle Progress ({completedInSet}/{cyclesInSet} to long break)</p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
              <div className="bg-primary-500 h-2.5 rounded-full transition-all" style={{ width: `${(completedInSet / cyclesInSet) * 100}%` }}></div>
            </div>
          </div>
        </div>
        
        {/* Motivational Quote */}
        <div className="flex flex-col justify-center text-center md:text-left md:border-l md:border-slate-200 md:dark:border-slate-700 md:pl-6">
           <div className="flex items-center gap-2 justify-center md:justify-start">
             <SparklesIcon className="w-5 h-5 text-amber-500"/>
             <h3 className="text-lg font-semibold">Daily Motivation</h3>
           </div>
           <blockquote className="mt-2 italic text-slate-600 dark:text-slate-300">
             "{quote.text}"
           </blockquote>
        </div>
      </div>
    </Card>
  );
}

export default DashboardPomodoro;