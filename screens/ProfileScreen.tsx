
import React, { useState, useRef, useMemo } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useProfile } from '../hooks/useProfile';
import { useAvatar } from '../hooks/useAvatar';
import { Avatar } from '../components/Avatar';
import { AvatarId } from '../types';
import { useGamification } from '../hooks/useGamification';
import { useExam } from '../hooks/useExam';
import { usePomodoro } from '../hooks/usePomodoro';
import { EditIcon } from '../components/icons/EditIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';
import { TrophyIcon } from '../components/icons/TrophyIcon';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { CameraIcon } from '../components/icons/CameraIcon';
import { GithubIcon } from '../components/icons/GithubIcon';
import { LinkedinIcon } from '../components/icons/LinkedinIcon';
import { LinkIcon } from '../components/icons/LinkIcon';
import { PlusIcon } from '../components/icons/PlusIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { achievementsList } from '../data/achievements';
import { blobToBase64 } from '../utils/fileParser';
import { ClockIcon } from '../components/icons/ClockIcon';
import { FireIcon } from '../components/icons/FireIcon';
import { GlobeIcon } from '../components/icons/GlobeIcon';

const AVATAR_IDS: AvatarId[] = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6'];

function ProfileScreen() {
    const { fullName, email, major, institution, graduationYear, country, educationLevel, bio, studyGoal, profilePicture, subjects, learningStyle, preferredStudyTime, links, updateProfile } = useProfile();
    const { avatarId, setAvatarId } = useAvatar();
    const { level, xp, streak, unlockedAchievements } = useGamification();
    const { results } = useExam();
    const { state: pomodoroState } = usePomodoro();

    const [isEditing, setIsEditing] = useState(false);
    const [isChangingAvatar, setIsChangingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [formData, setFormData] = useState({ fullName, email, major, institution, graduationYear, country, educationLevel, bio, studyGoal, subjects, learningStyle, preferredStudyTime, links });
    const [newSubject, setNewSubject] = useState('');

    const handleSave = () => {
        updateProfile(formData);
        setIsEditing(false);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            try {
                const base64 = await blobToBase64(file);
                updateProfile({ profilePicture: `data:${file.type};base64,${base64}` });
            } catch (err) { alert("Failed to upload image."); }
        }
    };

    const addSubject = () => {
        if (newSubject.trim() && !formData.subjects.includes(newSubject.trim())) {
            setFormData({ ...formData, subjects: [...formData.subjects, newSubject.trim()] });
            setNewSubject('');
        }
    };

    const xpForNextLevel = 100 * Math.pow(2, level - 1);
    const progress = Math.min((xp / xpForNextLevel) * 100, 100);
    const averageScore = results.length > 0 ? Math.round(results.reduce((a, c) => a + c.score, 0) / results.length) : 0;

    const rankTitle = useMemo(() => {
        if (level > 20) return "Grand Scholar";
        if (level > 10) return "Master Researcher";
        if (level > 5) return "Expert Learner";
        return "Novice Student";
    }, [level]);

    return (
        <div className="max-w-7xl mx-auto pb-32 space-y-12 animate-fade-in px-4">
            {/* Massive Header Hero */}
            <div className="relative group overflow-hidden rounded-[3rem] shadow-2xl h-96">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-indigo-700"></div>
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] animate-pulse"></div>
                
                <div className="absolute bottom-12 left-12 flex flex-col md:flex-row items-end gap-10">
                    <div className="relative">
                        <div className="w-56 h-56 rounded-[3rem] border-[12px] border-white dark:border-slate-900 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden group/avatar transition-all hover:scale-105">
                            {profilePicture ? (
                                <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <Avatar avatarId={avatarId} className="w-full h-full" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center transition-all duration-300 gap-4">
                                <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white text-primary-600 rounded-2xl hover:scale-110 transition-transform shadow-xl"><CameraIcon className="w-6 h-6" /></button>
                                <button onClick={() => setIsChangingAvatar(true)} className="p-3 bg-white text-indigo-600 rounded-2xl hover:scale-110 transition-transform shadow-xl"><EditIcon className="w-6 h-6" /></button>
                            </div>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>

                    <div className="text-white pb-6">
                        <div className="flex items-center gap-4">
                            <h1 className="text-6xl font-black tracking-tighter drop-shadow-lg">{fullName}</h1>
                            <span className="px-5 py-2 bg-amber-400 text-amber-950 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl">{rankTitle}</span>
                        </div>
                        <div className="flex flex-wrap gap-6 mt-4 opacity-90 text-sm font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-2"><BookOpenIcon className="w-5 h-5" /> {institution}</span>
                            <span className="flex items-center gap-2"><GlobeIcon className="w-5 h-5" /> {country}</span>
                            <span className="flex items-center gap-2"><ClockIcon className="w-5 h-5" /> Class of {graduationYear}</span>
                        </div>
                    </div>
                </div>

                <div className="absolute top-12 right-12 flex gap-4">
                    <Button onClick={() => setIsEditing(!isEditing)} size="lg" className={`rounded-[1.5rem] h-16 px-10 shadow-2xl transition-all ${isEditing ? 'bg-white !text-slate-900 border-none hover:bg-slate-100' : 'bg-black/20 backdrop-blur-xl border border-white/30 !text-white hover:bg-black/30'}`}>
                        <EditIcon className="w-6 h-6 mr-3" />
                        <span className="font-black uppercase tracking-widest">{isEditing ? 'Discard Changes' : 'Manage Profile'}</span>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Stats Sidebar */}
                <aside className="lg:col-span-4 space-y-10">
                    <Card className="!p-8 rounded-[2.5rem] border-none shadow-xl bg-slate-900 text-white overflow-hidden relative">
                         <div className="absolute top-0 right-0 p-8 opacity-10"><TrophyIcon className="w-32 h-32" /></div>
                         <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary-400 mb-8">Performance DNA</h3>
                         
                         <div className="space-y-10 relative z-10">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <p className="text-5xl font-black">{streak}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-400">Current Streak</p>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-5xl font-black">{averageScore}%</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary-400">Academic Index</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-white/10">
                                <div className="flex justify-between text-xs font-black uppercase mb-3">
                                    <span>Level {level} Experience</span>
                                    <span className="text-primary-400">{Math.round(progress)}%</span>
                                </div>
                                <div className="h-4 bg-white/10 rounded-full overflow-hidden p-1">
                                    <div style={{ width: `${progress}%` }} className="h-full bg-primary-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.6)] transition-all duration-1000"></div>
                                </div>
                                <p className="text-center text-[10px] font-bold text-white/40 mt-3 uppercase tracking-[0.2em]">{xp} XP TO NEXT TIER</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-6">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="block text-2xl font-black text-primary-300">{results.length}</span>
                                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Global Exams</span>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <span className="block text-2xl font-black text-primary-300">{Math.floor(pomodoroState.totalFocusTime / 60)}m</span>
                                    <span className="text-[8px] font-black uppercase text-white/40 tracking-widest">Deep Concentration</span>
                                </div>
                            </div>
                         </div>
                    </Card>

                    <Card className="!p-8 rounded-[2.5rem] border-none shadow-xl">
                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-8">Learning Preferences</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-500">Learning Type</span>
                                <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-black uppercase tracking-widest">{learningStyle}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-500">Peak Performance</span>
                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-xs font-black uppercase tracking-widest">{preferredStudyTime}</span>
                            </div>
                        </div>
                    </Card>
                </aside>

                {/* Content Area */}
                <main className="lg:col-span-8 space-y-10">
                    {!isEditing ? (
                        <>
                            <Card className="!p-10 rounded-[2.5rem] border-none shadow-xl min-h-[400px]">
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-10">Academic Narrative</h3>
                                <p className="text-2xl font-medium text-slate-800 dark:text-slate-100 leading-snug mb-12">
                                    {bio || "Your digital legacy is currently unwritten. Edit your profile to tell us about your scholarly mission."}
                                </p>

                                <div className="pt-10 border-t border-slate-100 dark:border-slate-800/50">
                                    <div className="flex justify-between items-end mb-10">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Scholarly Achievements</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Proof of Consistency & Mastery</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-4xl font-black text-primary-600">{unlockedAchievements.length}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Unlocked</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {achievementsList.map(ach => {
                                            const unlocked = unlockedAchievements.includes(ach.id);
                                            const Icon = ach.icon;
                                            return (
                                                <div key={ach.id} className={`flex flex-col items-center gap-4 p-6 rounded-[2rem] transition-all duration-700 border ${unlocked ? 'bg-slate-50 border-primary-100 shadow-sm scale-100' : 'opacity-10 grayscale scale-90 border-transparent'}`}>
                                                    <div className={`p-4 rounded-full ${unlocked ? 'bg-primary-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                                                        <Icon className="w-8 h-8" />
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">{ach.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Card>

                            <Card className="!p-10 rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-white to-primary-50/30 dark:from-slate-900 dark:to-primary-950/10">
                                <div className="flex flex-col md:flex-row justify-between gap-10">
                                    <div className="flex-1 space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary-500">North Star Goal</h3>
                                        <div className="relative">
                                            <span className="absolute -top-6 -left-4 text-8xl font-black text-primary-500/10 opacity-50">"</span>
                                            <p className="text-3xl font-black text-slate-900 dark:text-white leading-tight italic relative z-10">
                                                {studyGoal || "Establish your ultimate study milestone..."}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-64 space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary-500">Expertise</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {subjects.map(s => (
                                                <span key={s} className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary-600 shadow-sm border border-primary-50">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </>
                    ) : (
                        <Card className="!p-12 rounded-[3rem] border-none shadow-2xl">
                            <h3 className="text-3xl font-black mb-12 tracking-tight">Identity & Strategy</h3>
                            <div className="space-y-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Legal Full Name</label>
                                        <input className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 ring-primary-500/10 transition-all outline-none font-bold" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Academic Institution</label>
                                        <input className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 ring-primary-500/10 transition-all outline-none font-bold" value={formData.institution} onChange={e => setFormData({...formData, institution: e.target.value})} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Country / Region</label>
                                        <input className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 ring-primary-500/10 transition-all outline-none font-bold" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Expected Graduation</label>
                                        <input className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 ring-primary-500/10 transition-all outline-none font-bold" value={formData.graduationYear} onChange={e => setFormData({...formData, graduationYear: e.target.value})} />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Professional Biography</label>
                                    <textarea rows={6} className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl focus:ring-4 ring-primary-500/10 transition-all outline-none font-medium text-lg resize-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Learning Style</label>
                                        <select className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold appearance-none" value={formData.learningStyle} onChange={e => setFormData({...formData, learningStyle: e.target.value as any})}>
                                            <option>Visual</option>
                                            <option>Auditory</option>
                                            <option>Reading</option>
                                            <option>Kinesthetic</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Prime Study Hours</label>
                                        <select className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold appearance-none" value={formData.preferredStudyTime} onChange={e => setFormData({...formData, preferredStudyTime: e.target.value as any})}>
                                            <option>Morning</option>
                                            <option>Afternoon</option>
                                            <option>Evening</option>
                                            <option>Night</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-10 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-4">
                                    <Button variant="secondary" size="lg" className="rounded-2xl px-10 h-16 uppercase font-black tracking-widest" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button size="lg" className="rounded-2xl px-12 h-16 uppercase font-black tracking-widest shadow-2xl shadow-primary-500/30" onClick={handleSave}>Sync Data</Button>
                                </div>
                            </div>
                        </Card>
                    )}
                </main>
            </div>

            {/* Mascot Selection Overlay */}
            {isChangingAvatar && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-3xl animate-fade-in">
                    <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-[4rem] p-16 shadow-2xl relative">
                        <button onClick={() => setIsChangingAvatar(false)} className="absolute top-10 right-10 p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"><XCircleIcon className="w-8 h-8 text-slate-400" /></button>
                        <h2 className="text-5xl font-black text-center mb-4 tracking-tighter">Choose Your Guardian</h2>
                        <p className="text-center text-slate-400 font-bold uppercase tracking-[0.3em] mb-12 text-xs">A Visual Representation of your Academic Spirit</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                            {AVATAR_IDS.map(id => (
                                <button key={id} onClick={() => { setAvatarId(id); setIsChangingAvatar(false); }} className={`relative p-6 rounded-[3rem] transition-all duration-500 hover:scale-110 group ${avatarId === id ? 'bg-primary-600 shadow-2xl shadow-primary-500/40 rotate-3' : 'bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700'}`}>
                                    <div className="w-32 h-32 mx-auto">
                                        <Avatar avatarId={id} className="w-full h-full" />
                                    </div>
                                    {avatarId === id && <div className="absolute -top-4 -right-4 bg-white text-primary-600 rounded-2xl p-2 shadow-2xl ring-4 ring-primary-600"><CheckCircleIcon className="w-6 h-6" /></div>}
                                    <p className={`mt-4 text-center font-black uppercase tracking-widest text-[10px] ${avatarId === id ? 'text-white' : 'text-slate-400'}`}>Guard {id.slice(-1)}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Added missing Icons for the new layout
function GlobeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default ProfileScreen;
