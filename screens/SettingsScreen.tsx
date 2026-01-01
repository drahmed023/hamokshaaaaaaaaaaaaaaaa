import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useTheme } from '../hooks/useTheme';
import { useGamification } from '../hooks/useGamification';
import { GamificationActionType, AvatarId, BackgroundName, Font, ButtonShape, Mood, AIPersona, AIVoice, PomodoroActionType, AppDataActionType } from '../types';
import { Avatar } from '../components/Avatar';
import { useMusic } from '../hooks/useMusic';
import { musicTracks } from '../data/music';
import { useSmartSettings } from '../hooks/useSmartSettings';
import { SmartSettingsActionType } from '../types';
import { usePomodoro } from '../hooks/usePomodoro';
import { useAppData } from '../context/AppDataContext';

const ACCENT_COLORS = [
    { name: 'indigo', color: '#6366F1' },
    { name: 'sky', color: '#38BDF8' },
    { name: 'rose', color: '#F43F5E' },
    { name: 'emerald', color: '#10B981' },
    { name: 'orange', color: '#F97316' },
] as const;

const AVATAR_IDS: AvatarId[] = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6'];

const BACKGROUNDS: { name: BackgroundName, label: string, style: React.CSSProperties }[] = [
    { name: 'default', label: 'Default', style: { background: 'linear-gradient(to bottom, #e2e8f0, #f8fafc)'}},
    { name: 'sunset', label: 'Sunset', style: { background: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)'}},
    { name: 'galaxy', label: 'Galaxy', style: { background: '#00000c'}},
    { name: 'office', label: 'Office', style: { background: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)'}},
];

const FONTS: { id: Font, name: string }[] = [
    { id: 'modern', name: 'Modern (Inter)' },
    { id: 'classic', name: 'Classic (Lora)' },
    { id: 'study', name: 'Study (Roboto Slab)' },
];

const BUTTON_SHAPES: { id: ButtonShape, name: string }[] = [
    { id: 'rounded', name: 'Rounded' },
    { id: 'sharp', name: 'Sharp' },
    { id: 'pill', name: 'Pill' },
];

const MOODS: { id: Mood, name: string }[] = [
    { id: 'neutral', name: 'Neutral' },
    { id: 'focused', name: 'Focused' },
    { id: 'relaxed', name: 'Relaxed' },
    { id: 'motivated', name: 'Motivated' },
];

const AI_PERSONAS: { id: AIPersona, name: string }[] = [
    { id: 'friendly', name: 'Friendly' },
    { id: 'formal', name: 'Formal' },
    { id: 'motivational', name: 'Motivational' },
    { id: 'academic', name: 'Academic' },
];

const AI_VOICES: { id: AIVoice, name: string }[] = [
    { id: 'Kore', name: 'Kore (Female)' },
    { id: 'Puck', name: 'Puck (Male)' },
    { id: 'Charon', name: 'Charon (Male)' },
    { id: 'Fenrir', name: 'Fenrir (Male)' },
    { id: 'Zephyr', name: 'Zephyr (Female)' },
];


function SettingsSection({ title, children }: { title: string; children?: React.ReactNode }) {
    return (
        <Card>
            <details open className="group">
                <summary className="text-xl font-bold cursor-pointer list-none flex justify-between items-center">
                    {title}
                     <div className="transform transition-transform duration-200 group-open:rotate-180">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </summary>
                <div className="mt-4 space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {children}
                </div>
            </details>
        </Card>
    );
}

function SettingsRow({ label, children, description }: { label: string; children?: React.ReactNode; description?: string }) {
    return (
        <div>
            <div className="flex items-center justify-between">
                <label className="font-medium text-slate-800 dark:text-slate-100">{label}</label>
                {children}
            </div>
            {description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>}
        </div>
    );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
    return (
        <button
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`${checked ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors`}
        >
            <span className={`${checked ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
        </button>
    );
}


function SettingsScreen() {
  const { theme, toggleTheme, accentColor, setAccentColor, isAutoTheme, toggleAutoTheme, background, setBackground, font, setFont, buttonShape, setButtonShape, focusMode, setFocusMode, mood, setMood, avatarId, setAvatarId, phoneNumber, setPhoneNumber, reduceMotion, setReduceMotion } = useTheme();
  const { dispatch: gamificationDispatch } = useGamification();
  const { currentTrackId, isPlaying, volume, setTrack, togglePlay, setVolume } = useMusic();
  const settings = useSmartSettings();
  const { state: pomodoroState, dispatch: pomodoroDispatch } = usePomodoro();
  const [phoneInput, setPhoneInput] = React.useState(phoneNumber);
  const { dispatch: appDispatch } = useAppData();

  const handlePhoneSave = () => {
      setPhoneNumber(phoneInput);
      alert('Phone number saved!');
  };

  const handleLogoutAndClear = () => {
    if (window.confirm('Are you sure you want to log out and clear all data? This cannot be undone.')) {
        localStorage.removeItem('studySparkBackend');
        appDispatch({ type: AppDataActionType.SET_AUTH_STATE, payload: { isLoggedIn: false, isInitialized: true } });
        // No need to reload, the app state will handle the re-render to the login screen.
    }
  };

  const handleExportData = () => {
    try {
        const dataToExport = localStorage.getItem('studySparkBackend');
        if (!dataToExport) {
            alert("No data to export.");
            return;
        }
        const blob = new Blob([dataToExport], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `study-spark-ai-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to export data", error);
        alert("An error occurred while exporting your data.");
    }
  };

  const handlePomodoroDurationChange = (type: 'pomodoro' | 'short' | 'long', value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 1) return;

    pomodoroDispatch({
        type: PomodoroActionType.SET_DURATIONS,
        payload: {
            pomodoro: type === 'pomodoro' ? numValue : pomodoroState.pomodoroDuration,
            short: type === 'short' ? numValue : pomodoroState.shortBreakDuration,
            long: type === 'long' ? numValue : pomodoroState.longBreakDuration,
        }
    });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Smart Settings</h1>
      <div className="space-y-6">
        
        <SettingsSection title="UI & Theme">
          <SettingsRow label="Theme">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm"><ToggleSwitch checked={isAutoTheme} onChange={toggleAutoTheme} /> <label>Auto</label></div>
                <Button onClick={toggleTheme} variant="secondary" size="sm" disabled={isAutoTheme}>Switch to {theme === 'light' ? 'Dark' : 'Light'}</Button>
              </div>
          </SettingsRow>
          <SettingsRow label="Accent Color">
              <div className="flex items-center gap-3">
                  {ACCENT_COLORS.map(color => ( <button key={color.name} onClick={() => setAccentColor(color.name)} className={`w-8 h-8 rounded-full focus:outline-none transition-transform hover:scale-110 ${accentColor === color.name ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-primary-500' : ''}`} style={{ backgroundColor: color.color }} aria-label={`Set accent color to ${color.name}`} /> ))}
              </div>
          </SettingsRow>
          <SettingsRow label="Font">
              <select value={font} onChange={(e) => setFont(e.target.value as Font)} className="p-1 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 bg-white">
                  {FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
          </SettingsRow>
           <SettingsRow label="Button Shape">
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-md">
                {BUTTON_SHAPES.map(s => <React.Fragment key={s.id}>
                  <Button size="sm" variant={buttonShape === s.id ? 'primary' : 'secondary'} onClick={() => setButtonShape(s.id)}>{s.name}</Button>
                </React.Fragment>)}
              </div>
          </SettingsRow>
           <SettingsRow label="Focus Mode" description="Hides distracting elements during study sessions.">
              <ToggleSwitch checked={focusMode} onChange={setFocusMode} />
          </SettingsRow>
          <SettingsRow label="Mood Tracker" description="Adjusts the app's mood to match yours.">
              <select value={mood} onChange={(e) => setMood(e.target.value as Mood)} className="p-1 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 bg-white">
                  {MOODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
          </SettingsRow>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100 mb-2">Background</p>
            <div className="flex flex-wrap items-center gap-4">
               {BACKGROUNDS.map(bg => ( <button key={bg.name} onClick={() => setBackground(bg.name)} className={`w-24 h-16 rounded-lg border-2 transition-all ${background === bg.name ? 'border-primary-500 scale-105' : 'border-slate-300 dark:border-slate-600'}`} style={bg.style} aria-label={`Set background to ${bg.label}`}><span className="px-2 py-1 text-xs font-semibold rounded-full bg-black/40 text-white">{bg.label}</span></button> ))}
            </div>
          </div>
          <div>
            <p className="font-medium text-slate-800 dark:text-slate-100 mb-2">Avatar</p>
            <div className="flex flex-wrap items-center gap-4">
              {AVATAR_IDS.map(id => ( <button key={id} onClick={() => setAvatarId(id)} className={`avatar-picker-item w-16 h-16 p-1 rounded-full ${avatarId === id ? 'selected' : ''}`}><Avatar avatarId={id} /></button> ))}
            </div>
          </div>
        </SettingsSection>
        
        <SettingsSection title="AI Settings">
            <SettingsRow label="AI Persona" description="Choose the assistant's style.">
              <select value={settings.aiPersona} onChange={e => settings.dispatch({type: SmartSettingsActionType.SET_AI_PERSONA, payload: e.target.value as AIPersona})} className="p-1 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 bg-white">
                  {AI_PERSONAS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </SettingsRow>
            <SettingsRow label="Adaptive Learning" description="AI changes question difficulty based on your level.">
                <ToggleSwitch checked={settings.adaptiveLearning} onChange={val => settings.dispatch({type: SmartSettingsActionType.SET_ADAPTIVE_LEARNING, payload: val})} />
            </SettingsRow>
            <SettingsRow label="AI Voice Tutor" description="Enable audio explanations for complex topics.">
                <ToggleSwitch checked={settings.aiVoiceTutor} onChange={val => settings.dispatch({type: SmartSettingsActionType.SET_AI_VOICE_TUTOR, payload: val})} />
            </SettingsRow>
             <div className={`transition-all duration-300 ease-in-out ${settings.aiVoiceTutor ? 'opacity-100 max-h-20 pt-4' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                <SettingsRow label="AI Voice">
                    <select 
                    value={settings.aiVoice} 
                    onChange={e => settings.dispatch({type: SmartSettingsActionType.SET_AI_VOICE, payload: e.target.value as AIVoice})} 
                    className="p-1 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 bg-white"
                    disabled={!settings.aiVoiceTutor}
                    >
                        {AI_VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                </SettingsRow>
             </div>
             <SettingsRow label="Auto Planner" description="AI adjusts your study plan if your schedule changes.">
                <ToggleSwitch checked={settings.autoPlanner} onChange={val => settings.dispatch({type: SmartSettingsActionType.SET_AUTO_PLANNER, payload: val})} />
            </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Study & Exam Defaults">
            <SettingsRow label="Pomodoro Duration (minutes)">
                <input type="number" value={pomodoroState.pomodoroDuration} onChange={e => handlePomodoroDurationChange('pomodoro', e.target.value)} className="w-20 p-1 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600" />
            </SettingsRow>
            <SettingsRow label="Short Break Duration (minutes)">
                <input type="number" value={pomodoroState.shortBreakDuration} onChange={e => handlePomodoroDurationChange('short', e.target.value)} className="w-20 p-1 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600" />
            </SettingsRow>
            <SettingsRow label="Long Break Duration (minutes)">
                <input type="number" value={pomodoroState.longBreakDuration} onChange={e => handlePomodoroDurationChange('long', e.target.value)} className="w-20 p-1 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600" />
            </SettingsRow>
        </SettingsSection>
        
        <SettingsSection title="Accessibility">
            <SettingsRow label="Reduce Motion" description="Disables animations and transitions for a simpler interface.">
                <ToggleSwitch checked={reduceMotion} onChange={setReduceMotion} />
            </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Notifications">
            <SettingsRow label="WhatsApp Number" description="Used for sending task reminders. Include country code.">
                <div className="flex gap-2">
                    <input type="tel" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} placeholder="+11234567890" className="p-1 border border-slate-300 rounded-md dark:bg-slate-700 dark:border-slate-600 w-40" />
                    <Button onClick={handlePhoneSave} size="sm">Save</Button>
                </div>
            </SettingsRow>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                Note: This feature opens WhatsApp on your device with a pre-filled message for you to send to yourself as a reminder. No messages are sent automatically.
            </p>
        </SettingsSection>

        <SettingsSection title="Sound & Notifications">
            <SettingsRow label="Now Playing"><span>{musicTracks.find(t => t.id === currentTrackId)?.name || 'None'}</span></SettingsRow>
            <SettingsRow label="Master Volume">
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="w-40" />
            </SettingsRow>
             <div>
                <p className="font-medium text-slate-800 dark:text-slate-100 mb-2">Focus Music</p>
                <div className="flex flex-wrap gap-2">
                    <Button variant={!currentTrackId ? 'primary' : 'secondary'} size="sm" onClick={() => setTrack(null)}>None</Button>
                    {musicTracks.map(track => <React.Fragment key={track.id}>
                      <Button size="sm" variant={currentTrackId === track.id ? 'primary' : 'secondary'} onClick={() => setTrack(track.id)}>{track.name}</Button>
                    </React.Fragment>)}
                </div>
            </div>
        </SettingsSection>

        <SettingsSection title="Data Management">
            <SettingsRow label="Export Data" description="Save all your app data to a JSON file.">
              <Button onClick={handleExportData} variant="secondary" size="sm">Export</Button>
            </SettingsRow>
            <div className="mt-4 p-4 border border-red-300 dark:border-red-700 rounded-lg bg-red-50 dark:bg-red-900/20">
              <SettingsRow label="Logout & Clear All Data">
                <Button onClick={handleLogoutAndClear} variant="danger" size="sm">Logout & Clear</Button>
              </SettingsRow>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">This permanently deletes all your data and logs you out. This action cannot be undone.</p>
            </div>
        </SettingsSection>
      </div>
    </div>
  );
}

export default SettingsScreen;