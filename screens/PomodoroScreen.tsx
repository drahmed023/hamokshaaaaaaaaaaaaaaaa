import React, { useState, useEffect, useRef } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import CircularTimer from '../components/CircularTimer';
import SessionSummaryModal from '../components/SessionSummaryModal';
import { usePomodoro } from '../hooks/usePomodoro';
import { PomodoroActionType, GamificationActionType, SessionType } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useMusic } from '../hooks/useMusic';
// FIX: Correctly import getMotivationalMessage from geminiService.
import { getMotivationalMessage } from '../services/geminiService';
import { useGamification } from '../hooks/useGamification';

const SESSION_SETTINGS: Record<SessionType, { bg: 'default' | 'galaxy' | 'office', music: 'lofi' | 'study' | 'rain' }> = {
    'focus': { bg: 'default', music: 'lofi' },
    'review': { bg: 'office', music: 'study' },
    'mock-exam': { bg: 'galaxy', music: 'rain' },
};

function PomodoroScreen() {
    const { state, dispatch } = usePomodoro();
    const { sessionsToday } = state;
    const { setBackground } = useTheme();
    const { setTrack } = useMusic();
    const { dispatch: gamificationDispatch } = useGamification();
    const [motivationalMsg, setMotivationalMsg] = useState('');
    const inactivityTimerRef = useRef<number | null>(null);

    // Set theme based on session type
    useEffect(() => {
        const settings = SESSION_SETTINGS[state.sessionType];
        setBackground(settings.bg);
        setTrack(settings.music);
    }, [state.sessionType, setBackground, setTrack]);

    // Fetch motivational message when timer starts
    useEffect(() => {
        if (state.isActive && state.mode === 'pomodoro') {
            const fetchMsg = async () => {
                try {
                    const msg = await getMotivationalMessage();
                    setMotivationalMsg(msg);
                } catch (e) {
                    console.error("Failed to get motivational message", e);
                    setMotivationalMsg("Stay focused, you're doing great!");
                }
            };
            fetchMsg(); // Fetch only once when the session starts
        } else {
            setMotivationalMsg('');
        }
    }, [state.isActive, state.mode]);
    
    // Inactivity detection
    const resetInactivityTimer = () => {
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        if (state.isActive && state.mode === 'pomodoro') {
            inactivityTimerRef.current = window.setTimeout(() => {
                if (window.confirm("Are you still there? The timer is paused. Click OK to resume.")) {
                    resetInactivityTimer();
                } else {
                    dispatch({ type: PomodoroActionType.TOGGLE_ACTIVE });
                }
            }, 5 * 60 * 1000); // 5 minutes of inactivity
        }
    };

    useEffect(() => {
        window.addEventListener('mousemove', resetInactivityTimer);
        window.addEventListener('keydown', resetInactivityTimer);
        resetInactivityTimer();
        return () => {
            window.removeEventListener('mousemove', resetInactivityTimer);
            window.removeEventListener('keydown', resetInactivityTimer);
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        };
    }, [state.isActive]);
    
    // Gamification on session completion
    useEffect(() => {
        if (state.showSummary) {
            gamificationDispatch({ type: GamificationActionType.ADD_XP, payload: 100 });
            if (sessionsToday === 1) {
                gamificationDispatch({ type: GamificationActionType.UNLOCK_ACHIEVEMENT, payload: 'pomodoro_1' });
            }
        }
    }, [state.showSummary, sessionsToday, gamificationDispatch]);

    const handleSessionTypeChange = (type: SessionType) => {
        if (state.isActive) {
            if (!window.confirm('This will stop the current session. Are you sure?')) return;
        }
        dispatch({ type: PomodoroActionType.SET_SESSION_TYPE, payload: type });
        dispatch({ type: PomodoroActionType.RESET });
    };

    return (
        <div className="max-w-xl mx-auto flex flex-col items-center text-center space-y-6">
            <h1 className="text-3xl font-bold">AI Pomodoro Room</h1>
            
            {/* Fix: Added children to Card component to resolve missing prop error. */}
            <Card className="w-full">
                <div className="flex justify-center flex-wrap gap-2 mb-6">
                    {(Object.keys(SESSION_SETTINGS) as SessionType[]).map(type => (
                        <React.Fragment key={type}>
                            {/* Fix: Added children to Button component to resolve missing prop error. */}
                            <Button
                                variant={state.sessionType === type ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => handleSessionTypeChange(type)}
                            >
                                {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                            </Button>
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex justify-center mb-6">
                    <CircularTimer />
                </div>
                {state.isActive && motivationalMsg && (
                    <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                        {motivationalMsg}
                    </div>
                )}
                 <div className="flex justify-center gap-4">
                    {/* Fix: Added children to Button component to resolve missing prop error. */}
                    <Button onClick={() => dispatch({ type: PomodoroActionType.TOGGLE_ACTIVE })} size="lg" className="w-36">
                        {state.isActive ? 'Pause' : 'Start'}
                    </Button>
                    {/* Fix: Added children to Button component to resolve missing prop error. */}
                    <Button onClick={() => dispatch({ type: PomodoroActionType.RESET })} variant="secondary" size="lg">
                        Reset
                    </Button>
                </div>
            </Card>

            {/* Fix: Added children to Card component to resolve missing prop error. */}
            <Card className="w-full">
                <h2 className="text-xl font-bold mb-4">Today's Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                        <p className="text-3xl font-bold">{state.sessionsToday}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Sessions Completed</p>
                    </div>
                     <div className="text-center p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                        <p className="text-3xl font-bold">{Math.floor(state.totalFocusTime / 60)}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Minutes Focused</p>
                    </div>
                </div>
            </Card>

            <SessionSummaryModal 
                isOpen={state.showSummary} 
                onClose={() => dispatch({ type: PomodoroActionType.CLOSE_SUMMARY })} 
            />
        </div>
    );
};

export default PomodoroScreen;