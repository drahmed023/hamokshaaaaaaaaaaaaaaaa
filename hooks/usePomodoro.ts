import { useAppData } from '../context/AppDataContext';
import { useEffect } from 'react';
import { PomodoroActionType } from '../types';

let audioContext: AudioContext | null = null;
let notificationBuffer: AudioBuffer | null = null;
const NOTIFICATION_SOUND_URL = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';

const initializeAudio = async () => {
    if (typeof window !== 'undefined' && !audioContext) {
        try {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const response = await fetch(NOTIFICATION_SOUND_URL);
            const arrayBuffer = await response.arrayBuffer();
            notificationBuffer = await audioContext.decodeAudioData(arrayBuffer);
        } catch (error) { console.error("Error initializing audio:", error); }
    }
};

const playNotificationSound = () => {
    if (audioContext && notificationBuffer && audioContext.state === 'running') {
        const source = audioContext.createBufferSource();
        source.buffer = notificationBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    }
};

export const usePomodoro = () => {
  const { state, dispatch } = useAppData();
  const pomodoroState = state.pomodoroState;

  useEffect(() => { initializeAudio(); }, []);
  
  useEffect(() => {
    if (pomodoroState.isActive && pomodoroState.timeLeft <= 0) {
      playNotificationSound();
      dispatch({ type: PomodoroActionType.FINISH_SESSION });
    }
  }, [pomodoroState.timeLeft, pomodoroState.isActive, dispatch]);

  useEffect(() => {
    let interval: number | null = null;
    if (pomodoroState.isActive) {
      interval = window.setInterval(() => {
        dispatch({ type: PomodoroActionType.TICK });
      }, 1000);
    }
    return () => { if (interval) window.clearInterval(interval); };
  }, [pomodoroState.isActive, dispatch]);

  // Special dispatch for TOGGLE_ACTIVE to handle AudioContext resume
  const toggleActive = () => {
      if (audioContext && audioContext.state === 'suspended') {
          audioContext.resume();
      }
      dispatch({ type: PomodoroActionType.TOGGLE_ACTIVE });
  }

  return { state: pomodoroState, dispatch, toggleActive };
};
