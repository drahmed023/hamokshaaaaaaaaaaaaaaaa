
import React, { useState, useRef } from 'react';
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

const AVATAR_IDS: AvatarId[] = ['avatar1', 'avatar2', 'avatar3', 'avatar4', 'avatar5', 'avatar6'];

function ProfileScreen() {
    const { fullName, email, major, educationLevel, bio, studyGoal, profilePicture, subjects, links, updateProfile } = useProfile();
    const { avatarId, setAvatarId } = useAvatar();
    const { level, xp, streak, unlockedAchievements } = useGamification();
    const { results } = useExam();
    const { state: pomodoroState } = usePomodoro();

    const [isEditing, setIsEditing] = useState(false);
    const [isChangingAvatar, setIsChangingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Form local state
    const [formData, setFormData] = useState({ fullName, email, major, educationLevel, bio, studyGoal, subjects, links });
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
            } catch (err) {
                alert("Failed to upload image.");
            }
        }
    };

    const addSubject = () => {
        if (newSubject.trim() && !formData.subjects.includes(newSubject.trim())) {
            setFormData({ ...formData, subjects: [...formData.subjects, newSubject.trim()] });
            setNewSubject('');
        }
    };

    const removeSubject = (sub: string) => {
        setFormData({ ...formData, subjects: formData.subjects.filter(s => s !== sub) });
    };

    const xpForNextLevel = 100 * Math.pow(2, level - 1);
    const progress = Math.min((xp / xpForNextLevel) * 100, 100);
    const averageScore = results.length > 0 
        ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length) 
        : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
            {/* Header / Banner */}
            <div className="relative h-64 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute inset-0 bg-black/10"></div>
            </div>
            
            {/* Profile Info Overlay */}
            <div className="px-8 -mt-28 relative z-10 flex flex-col md:flex-row items-center md:items-end gap-8">
                <div className="relative group">
                    <div className="w-48 h-48 rounded-3xl border-8 border-white dark:border-slate-900 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden">
                        {profilePicture ? (
                            <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <Avatar avatarId={avatarId} className="w-full h-full" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 gap-2">
                            <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white rounded-full text-primary-600 hover:scale-110 transition-transform">
                                <CameraIcon className="w-6 h-6" />
                            </button>
                            <button onClick={() => setIsChangingAvatar(true)} className="p-2 bg-white rounded-full text-indigo-600 hover:scale-110 transition-transform">
                                <EditIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                </div>
                
                <div className="flex-grow text-center md:text-left mb-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white drop-shadow-sm">{fullName}</h1>
                        <span className="hidden md:inline px-3 py-1 bg-white/20 backdrop-blur-md text-white rounded-full text-xs font-bold uppercase tracking-wider">Level {level} Elite</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 font-bold mt-1 flex items-center justify-center md:justify-start gap-2">
                        <BookOpenIcon className="w-4 h-4 text-primary-500" />
                        {major} • {educationLevel}
                    </p>
                    <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                        {links.linkedin && <a href={links.linkedin} target="_blank" className="text-slate-400 hover:text-blue-500 transition-colors"><LinkedinIcon className="w-5 h-5" /></a>}
                        {links.github && <a href={links.github} target="_blank" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><GithubIcon className="w-5 h-5" /></a>}
                        {links.portfolio && <a href={links.portfolio} target="_blank" className="text-slate-400 hover:text-primary-500 transition-colors"><LinkIcon className="w-5 h-5" /></a>}
                    </div>
                </div>

                <div className="flex gap-3 mb-4">
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)} size="lg" className="rounded-2xl shadow-xl shadow-primary-500/20">
                            <EditIcon className="w-5 h-5 mr-2" />
                            Edit Profile
                        </Button>
                    ) : (
                        <>
                            <Button variant="secondary" size="lg" className="rounded-2xl" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button size="lg" className="rounded-2xl shadow-xl shadow-primary-500/20" onClick={handleSave}>Save Profile</Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Side Info */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="border-none shadow-xl">
                        <h3 className="font-black text-lg mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                            <TrophyIcon className="w-5 h-5 text-amber-500" />
                            Analytics Dashboard
                        </h3>
                        <div className="space-y-8">
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-black inline-block py-1 px-2 uppercase rounded-full text-primary-600 bg-primary-100">
                                            XP Progress
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-black inline-block text-primary-600">
                                            {Math.round(progress)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100 dark:bg-slate-800">
                                    <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary-500 transition-all duration-1000"></div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold text-center">{xp} / {xpForNextLevel} XP to Level {level+1}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 bg-orange-50 dark:bg-orange-900/10 rounded-3xl text-center border border-orange-100 dark:border-orange-800/30">
                                    <span className="block text-3xl font-black text-orange-600">{streak}</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">Day Streak</span>
                                </div>
                                <div className="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl text-center border border-emerald-100 dark:border-emerald-800/30">
                                    <span className="block text-3xl font-black text-emerald-600">{averageScore}%</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Avg. Score</span>
                                </div>
                                <div className="p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-3xl text-center border border-indigo-100 dark:border-indigo-800/30">
                                    <span className="block text-3xl font-black text-indigo-600">{results.length}</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">Exams Done</span>
                                </div>
                                <div className="p-5 bg-purple-50 dark:bg-purple-900/10 rounded-3xl text-center border border-purple-100 dark:border-purple-800/30">
                                    <span className="block text-3xl font-black text-purple-600">{Math.floor(pomodoroState.totalFocusTime / 3600)}h</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-500">Focused</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="border-none shadow-xl">
                        <h3 className="font-black text-lg mb-6 flex items-center gap-2 text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                            Core Subjects
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {formData.subjects.map(sub => (
                                <div key={sub} className="group relative">
                                    <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl text-sm font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                        {sub}
                                        {isEditing && (
                                            <button onClick={() => removeSubject(sub)} className="text-red-500 hover:scale-125 transition-transform">
                                                <XCircleIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </span>
                                </div>
                            ))}
                            {isEditing && (
                                <div className="flex gap-2 w-full mt-4">
                                    <input 
                                        className="flex-grow p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                                        placeholder="Add subject..."
                                        value={newSubject}
                                        onChange={e => setNewSubject(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addSubject()}
                                    />
                                    <Button onClick={addSubject} size="sm" className="!p-2">
                                        <PlusIcon className="w-5 h-5" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">
                    {!isEditing ? (
                        <>
                            <Card className="border-none shadow-xl min-h-[250px]">
                                <h3 className="font-black text-2xl mb-6 text-slate-800 dark:text-slate-100">About Me</h3>
                                <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
                                    {bio || "You haven't added a biography yet. Tell the AI and the world about your academic journey!"}
                                </p>
                                
                                <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800/50">
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="font-black text-xl text-slate-800 dark:text-slate-100">Achievement Showcase</h3>
                                        <span className="text-xs font-bold text-primary-500 uppercase tracking-widest">{unlockedAchievements.length} / {achievementsList.length} Unlocked</span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                        {achievementsList.map(ach => {
                                            const unlocked = unlockedAchievements.includes(ach.id);
                                            const Icon = ach.icon;
                                            return (
                                                <div key={ach.id} className={`flex flex-col items-center gap-3 p-4 rounded-3xl transition-all duration-500 ${unlocked ? 'bg-white dark:bg-slate-800 shadow-md scale-100' : 'opacity-20 grayscale scale-90'}`}>
                                                    <div className={`p-4 rounded-full ${unlocked ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                                        <Icon className="w-8 h-8" />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-[11px] font-black uppercase tracking-tight leading-tight block">{ach.name}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Card>

                            <Card className="border-none shadow-xl">
                                <h3 className="font-black text-xl mb-6 text-slate-800 dark:text-slate-100">Academic Vision</h3>
                                <div className="p-6 bg-primary-50 dark:bg-primary-900/10 rounded-3xl border-2 border-dashed border-primary-200 dark:border-primary-800">
                                    <p className="text-primary-800 dark:text-primary-300 font-black italic text-xl text-center">
                                        "{studyGoal || 'Set your big goal in the edit section!'}"
                                    </p>
                                </div>
                            </Card>
                        </>
                    ) : (
                        <Card className="border-none shadow-xl">
                            <h3 className="font-black text-2xl mb-8">Refine Your Professional Profile</h3>
                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                                        <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 ring-primary-500 transition-all outline-none" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Email</label>
                                        <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 ring-primary-500 transition-all outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Field of Study</label>
                                        <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 ring-primary-500 transition-all outline-none" value={formData.major} onChange={e => setFormData({...formData, major: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Level</label>
                                        <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 ring-primary-500 transition-all outline-none" value={formData.educationLevel} onChange={e => setFormData({...formData, educationLevel: e.target.value})}>
                                            <option>Secondary School</option>
                                            <option>College / University</option>
                                            <option>Postgraduate</option>
                                            <option>Professional</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Biography</label>
                                    <textarea rows={5} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 ring-primary-500 transition-all outline-none resize-none" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-black text-slate-500 uppercase tracking-widest">Primary Study Goal</label>
                                    <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 ring-primary-500 transition-all outline-none" value={formData.studyGoal} onChange={e => setFormData({...formData, studyGoal: e.target.value})} />
                                </div>

                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="font-black text-lg mb-6">Social Connections</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold flex items-center gap-2"><LinkedinIcon className="w-4 h-4 text-blue-600" /> LinkedIn URL</label>
                                            <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" value={formData.links.linkedin || ''} onChange={e => setFormData({...formData, links: {...formData.links, linkedin: e.target.value}})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold flex items-center gap-2"><GithubIcon className="w-4 h-4 text-slate-800 dark:text-white" /> GitHub URL</label>
                                            <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" value={formData.links.github || ''} onChange={e => setFormData({...formData, links: {...formData.links, github: e.target.value}})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold flex items-center gap-2"><LinkIcon className="w-4 h-4 text-primary-600" /> Portfolio URL</label>
                                            <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl" value={formData.links.portfolio || ''} onChange={e => setFormData({...formData, links: {...formData.links, portfolio: e.target.value}})} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </div>

            {/* Avatar Modal */}
            {isChangingAvatar && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <Card className="max-w-xl w-full border-none shadow-2xl p-10">
                        <h2 className="text-3xl font-black text-center mb-8">Select Your Mascot</h2>
                        <div className="grid grid-cols-3 gap-6">
                            {AVATAR_IDS.map(id => (
                                <button key={id} onClick={() => { setAvatarId(id); setIsChangingAvatar(false); }} className={`relative p-3 rounded-3xl transition-all duration-300 hover:scale-105 ${avatarId === id ? 'bg-primary-100 ring-4 ring-primary-500' : 'bg-slate-100 hover:bg-primary-50'}`}>
                                    <Avatar avatarId={id} className="w-full h-full" />
                                    {avatarId === id && <div className="absolute -top-2 -right-2 bg-primary-600 text-white rounded-full p-1.5 shadow-lg"><CheckCircleIcon className="w-4 h-4" /></div>}
                                </button>
                            ))}
                        </div>
                        <div className="mt-10 flex justify-center">
                            <Button variant="secondary" size="lg" className="px-10 rounded-2xl" onClick={() => setIsChangingAvatar(false)}>Close Gallery</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}

export default ProfileScreen;
