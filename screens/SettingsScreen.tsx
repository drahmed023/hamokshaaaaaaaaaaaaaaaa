
import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useTheme } from '../hooks/useTheme';
import { useGamification } from '../hooks/useGamification';
import { GamificationActionType, AvatarId, BackgroundName, Font, ButtonShape, Mood, AIPersona, AIVoice, PomodoroActionType, AppDataActionType, FontSize, ContainerWidth } from '../types';
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
    { name: 'violet', color: '#8B5CF6' },
    { name: 'amber', color: '#F59E0B' },
    { name: 'teal', color: '#14B8A6' },
    { name: 'pink', color: '#EC4899' },
    { name: 'slate', color: '#64748B' },
] as const;

const AVATAR_IDS: AvatarId[] = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6'];

const BACKGROUNDS: { name: BackgroundName, label: string, style: React.CSSProperties }[] = [
    { name: 'default', label: 'Default', style: { background: 'linear-gradient(to bottom, #e2e8f0, #f8fafc)'}},
    { name: 'sunset', label: 'Sunset', style: { background: 'linear-gradient(120deg, #f6d365 0%, #fda085 100%)'}},
    { name: 'galaxy', label: 'Galaxy', style: { background: '#00000c'}},
    { name: 'office', label: 'Office', style: { background: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)'}},
    { name: 'forest', label: 'Forest', style: { background: 'linear-gradient(135deg, #134e4a 0%, #064e3b 100%)'}},
    { name: 'ocean', label: 'Ocean', style: { background: 'linear-gradient(180deg, #0c4a6e 0%, #075985 100%)'}},
    { name: 'minimal', label: 'Minimal', style: { background: '#f8fafc', border: '1px solid #e2e8f0'}},
    { name: 'midnight', label: 'Midnight', style: { background: '#020617'}},
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
            <div className="flex items-center justify-between gap-4">
                <label className="font-medium text-slate-800 dark:text-slate-100 flex-shrink-0">{label}</label>
                <div className="flex-grow flex justify-end">{children}</div>
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
  const { theme, toggleTheme, accentColor, setAccentColor, isAutoTheme, toggleAutoTheme, background, setBackground, font, setFont, customFontSize, setCustomFontSize, customContainerWidth, setCustomContainerWidth, containerWidth, setContainerWidth, buttonShape, setButtonShape, focusMode, setFocusMode, mood, setMood, avatarId, setAvatarId, phoneNumber, setPhoneNumber, reduceMotion, setReduceMotion } = useTheme();
  const { currentTrackId, volume, setTrack, setVolume } = useMusic();
  const settings = useSmartSettings();
  const { state: pomodoroState, dispatch: pomodoroDispatch } = usePomodoro();
  const [phoneInput, setPhoneInput] = React.useState(phoneNumber);
  const { dispatch: appDispatch } = useAppData();

  const handleLogoutAndClear = () => {
    if (window.confirm('Are you sure you want to log out and clear all data? This cannot be undone.')) {
        localStorage.removeItem('studySparkBackend');
        appDispatch({ type: AppDataActionType.SET_AUTH_STATE, payload: { isLoggedIn: false, isInitialized: true } });
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
    <div className="max-w-3xl mx-auto pb-20 px-4">
      <h1 className="text-4xl font-black text-center mb-10 tracking-tight">System Configuration</h1>
      <div className="space-y-6">
        
        <SettingsSection title="Visual Identity">
          <SettingsRow label="Theme Mode">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm"><ToggleSwitch checked={isAutoTheme} onChange={toggleAutoTheme} /> <label>Auto-sync</label></div>
                <Button onClick={toggleTheme} variant="secondary" size="sm" disabled={isAutoTheme}>Set {theme === 'light' ? 'Dark' : 'Light'}</Button>
              </div>
          </SettingsRow>
          <SettingsRow label="Accent Palette">
              <div className="flex flex-wrap items-center gap-3">
                  {ACCENT_COLORS.map(color => ( <button key={color.name} onClick={() => setAccentColor(color.name)} className={`w-8 h-8 rounded-full focus:outline-none transition-transform hover:scale-110 ${accentColor === color.name ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-primary-500 shadow-lg' : ''}`} style={{ backgroundColor: color.color }} aria-label={`Set accent color to ${color.name}`} /> ))}
              </div>
          </SettingsRow>
          <SettingsRow label="Typography Family">
              <select value={font} onChange={(e) => setFont(e.target.value as Font)} className="p-2 border-2 border-slate-100 rounded-xl dark:bg-slate-800 dark:border-slate-700 bg-white font-bold">
                  {FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
          </SettingsRow>
           <SettingsRow label="Button Styling">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-xl">
                {BUTTON_SHAPES.map(s => (
                  <Button key={s.id} size="sm" variant={buttonShape === s.id ? 'primary' : 'secondary'} className="!text-xs font-black uppercase" onClick={() => setButtonShape(s.id)}>{s.name}</Button>
                ))}
              </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Interface Scaling">
            <SettingsRow label="Interactive Font Scale" description="Drag to adjust the global readability level of the application.">
                <div className="flex items-center gap-4 w-full">
                    <input 
                        type="range" min="12" max="32" step="1" 
                        value={customFontSize} 
                        onChange={(e) => setCustomFontSize(parseInt(e.target.value))} 
                        className="flex-grow accent-primary-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" 
                    />
                    <span className="w-12 text-center font-black bg-primary-100 text-primary-700 px-2 py-1 rounded-lg text-xs">{customFontSize}px</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Workspace Canvas Width" description="Adjust the maximum horizontal reach of the study dashboards.">
                <div className="flex items-center gap-4 w-full">
                    <input 
                        type="range" min="600" max="1920" step="20" 
                        value={customContainerWidth} 
                        onChange={(e) => {
                            setCustomContainerWidth(parseInt(e.target.value));
                            if (containerWidth === 'full') setContainerWidth('standard');
                        }} 
                        className="flex-grow accent-primary-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer" 
                    />
                    <span className="w-16 text-center font-black bg-primary-100 text-primary-700 px-2 py-1 rounded-lg text-xs">{customContainerWidth}px</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Full Width Display">
                 <ToggleSwitch checked={containerWidth === 'full'} onChange={(val) => setContainerWidth(val ? 'full' : 'standard')} />
            </SettingsRow>
            <SettingsRow label="Compact UI Rendering" description="Aggressive space optimization for high-density academic data.">
              <ToggleSwitch checked={settings.compactMode} onChange={val => settings.dispatch({type: SmartSettingsActionType.SET_COMPACT_MODE, payload: val})} />
            </SettingsRow>
            <SettingsRow label="Immersive Focus Mode" description="Automatically hides non-essential dashboard widgets during focus sessions.">
              <ToggleSwitch checked={focusMode} onChange={setFocusMode} />
            </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Ambience & Persona">
          <SettingsRow label="AI Companion Persona" description="How Dr. Zayn interacts with your study requests.">
              <select value={settings.aiPersona} onChange={e => settings.dispatch({type: SmartSettingsActionType.SET_AI_PERSONA, payload: e.target.value as AIPersona})} className="p-2 border-2 border-slate-100 rounded-xl dark:bg-slate-800 dark:border-slate-700 bg-white font-bold">
                  {AI_PERSONAS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
          </SettingsRow>
          <div>
            <p className="font-black text-sm text-slate-500 uppercase tracking-widest mb-3 ml-1">Study Soundscapes</p>
            <div className="flex flex-wrap gap-2 mb-4">
                <Button variant={!currentTrackId ? 'primary' : 'secondary'} size="sm" onClick={() => setTrack(null)}>Silent Mode</Button>
                {musicTracks.map(track => (
                  <Button key={track.id} size="sm" variant={currentTrackId === track.id ? 'primary' : 'secondary'} onClick={() => setTrack(track.id)}>{track.name}</Button>
                ))}
            </div>
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                <span className="text-xs font-black uppercase text-slate-400">Master Volume</span>
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))} className="flex-grow accent-primary-600" />
            </div>
          </div>
          <div className="mt-6">
            <p className="font-black text-sm text-slate-500 uppercase tracking-widest mb-3 ml-1">Atmospheric Backgrounds</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
               {BACKGROUNDS.map(bg => ( <button key={bg.name} onClick={() => setBackground(bg.name)} className={`w-full h-16 rounded-2xl border-4 transition-all ${background === bg.name ? 'border-primary-500 scale-105 shadow-xl' : 'border-slate-100 dark:border-slate-800'}`} style={bg.style} aria-label={`Set background to ${bg.label}`}><span className="px-2 py-1 text-[10px] font-black uppercase rounded-lg bg-black/40 text-white">{bg.label}</span></button> ))}
            </div>
          </div>
        </SettingsSection>
        
        <SettingsSection title="Advanced Academic Engine">
            <SettingsRow label="Adaptive Difficulty" description="AI will dynamically scale complexity based on your accuracy trends.">
                <ToggleSwitch checked={settings.adaptiveLearning} onChange={val => settings.dispatch({type: SmartSettingsActionType.SET_ADAPTIVE_LEARNING, payload: val})} />
            </SettingsRow>
            <SettingsRow label="AI Voice Synthesis" description="Enable neural text-to-speech for interactive audio explanations.">
                <ToggleSwitch checked={settings.aiVoiceTutor} onChange={val => settings.dispatch({type: SmartSettingsActionType.SET_AI_VOICE_TUTOR, payload: val})} />
            </SettingsRow>
            {settings.aiVoiceTutor && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl animate-fade-in">
                    <SettingsRow label="Select Voice Profile">
                        <select 
                            value={settings.aiVoice} 
                            onChange={e => settings.dispatch({type: SmartSettingsActionType.SET_AI_VOICE, payload: e.target.value as AIVoice})} 
                            className="p-2 border-2 border-slate-200 rounded-xl dark:bg-slate-700 bg-white font-bold text-sm"
                        >
                            {AI_VOICES.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </SettingsRow>
                </div>
            )}
        </SettingsSection>

        <Card className="!bg-rose-50 dark:!bg-rose-950/20 border-rose-100 dark:border-rose-900">
            <h3 className="font-black text-rose-800 dark:text-rose-400 uppercase tracking-tighter text-xl mb-4">Danger Zone</h3>
            <p className="text-sm font-bold text-rose-700 dark:text-rose-300 mb-6">Resetting will permanently delete all exams, study plans, and achievement progress stored on this device.</p>
            <Button onClick={handleLogoutAndClear} variant="danger" className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-rose-500/20">Purge All Data & Logout</Button>
        </Card>
      </div>
    </div>
  );
}

export default SettingsScreen;
