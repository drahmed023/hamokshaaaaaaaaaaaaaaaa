
import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { useStudyPlan } from '../hooks/useStudyPlan';
import { useTasks } from '../hooks/useTasks';
import { StudyPlanActionType, StudyPlan, TasksActionType, Task } from '../types';
import { generateStudyPlan } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { useDropzone } from 'react-dropzone';
import { parseFileToText } from '../utils/fileParser';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { TrendingUpIcon } from '../components/icons/TrendingUpIcon';
import { YouTubeIcon } from '../components/icons/YouTubeIcon';
import { LightbulbIcon } from '../components/icons/LightbulbIcon';
import { useToasts } from '../context/ToastContext';
import { CheckBadgeIcon } from '../components/icons/CheckBadgeIcon';

const WEEK_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const YouTubeSearchButton = ({ query }: { query?: string }) => {
    if (!query) return null;
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    return (
        <a 
            href={searchUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg hover:bg-rose-100 transition-colors border border-rose-100"
        >
            <YouTubeIcon className="w-3 h-3" />
            Find on YouTube
        </a>
    );
};

const StudyPlanCreator = ({ onCreated }: { onCreated: (p: any) => void }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        examName: '',
        examDate: '',
        startDate: new Date().toISOString().split('T')[0],
        studyDays: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        dailyHours: 4,
        intensity: 'Balanced',
        topics: ''
    });

    const handleFile = async (file: File) => {
        setLoading(true);
        try {
            const content = await parseFileToText(file);
            setFormData(prev => ({ ...prev, topics: content }));
        } catch (err) { alert("Error parsing file."); }
        finally { setLoading(false); }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: files => handleFile(files[0]),
        accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] }
    });

    const toggleDay = (day: string) => {
        setFormData(prev => ({
            ...prev,
            studyDays: prev.studyDays.includes(day) 
                ? prev.studyDays.filter(d => d !== day) 
                : [...prev.studyDays, day]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.studyDays.length === 0) return alert("Please select at least one study day.");
        setLoading(true);
        try {
            const planData = await generateStudyPlan(formData);
            // FIX: Constructing StudyPlan object with all required properties to satisfy interface definition in types.ts
            const newPlan: StudyPlan = { 
                targetScore: planData.targetScore || "85%",
                masterPlan: planData.masterPlan || [],
                dailyBlocks: planData.dailyBlocks || [],
                assessments: planData.assessments || [],
                ...planData, 
                id: Date.now().toString(), 
                examName: formData.examName,
                examDate: formData.examDate,
                startDate: formData.startDate,
                studyDays: formData.studyDays,
                intensity: formData.intensity as any,
                createdAt: new Date().toISOString() 
            };
            onCreated(newPlan);
        } catch (err: any) { alert(err.message || "Failed to generate plan."); }
        finally { setLoading(false); }
    };

    return (
        <Card className="max-w-4xl mx-auto border-none shadow-2xl p-10 bg-white/80 backdrop-blur-md">
            <form onSubmit={handleSubmit} className="space-y-10">
                <div className="text-center">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Plan Architect</h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Custom High-Yield Study Mission</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Target Exam</label>
                        <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:ring-2 ring-primary-500/20" value={formData.examName} onChange={e => setFormData({...formData, examName: e.target.value})} placeholder="e.g. USMLE Step 1" required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Exam Deadline</label>
                        <input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={formData.examDate} onChange={e => setFormData({...formData, examDate: e.target.value})} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Plan Start Date</label>
                        <input type="date" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Daily Hours</label>
                        <input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" value={formData.dailyHours} onChange={e => setFormData({...formData, dailyHours: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Intensity</label>
                        <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold appearance-none" value={formData.intensity} onChange={e => setFormData({...formData, intensity: e.target.value})}>
                            <option>Relaxed</option>
                            <option>Balanced</option>
                            <option>Intensive</option>
                        </select>
                    </div>
                </div>

                {/* Study Days Selector */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Active Study Days</label>
                    <div className="flex flex-wrap gap-2">
                        {WEEK_DAYS.map(day => (
                            <button
                                key={day}
                                type="button"
                                onClick={() => toggleDay(day)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                    formData.studyDays.includes(day)
                                    ? 'bg-primary-600 text-white shadow-lg scale-105'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Topics / Curriculum</label>
                    <div {...getRootProps()} className="p-8 border-4 border-dashed border-slate-100 rounded-[2rem] text-center cursor-pointer hover:border-primary-400 transition-all group">
                        <input {...getInputProps()} />
                        <p className="font-black text-slate-800 uppercase tracking-tight">Upload Syllabus / Notes</p>
                        <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">PDF, DOCX OR PASTE BELOW</p>
                    </div>
                    <textarea rows={4} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] text-sm font-medium" placeholder="Paste specific topics..." value={formData.topics} onChange={e => setFormData({...formData, topics: e.target.value})} />
                </div>

                <Button type="submit" disabled={loading || !formData.topics} className="w-full h-16 rounded-[1.5rem] shadow-2xl shadow-primary-500/30">
                    {loading ? <Loader text="Building Strategy..." /> : (
                        <div className="flex items-center gap-3">
                            <SparklesIcon className="w-6 h-6" />
                            <span className="font-black uppercase tracking-[0.2em]">Generate Mission Matrix</span>
                        </div>
                    )}
                </Button>
            </form>
        </Card>
    );
};

const DataTable = ({ title, headers, rows, renderCell }: any) => (
    <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] pl-2 border-l-4 border-primary-500">{title}</h3>
        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xl">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>{headers.map((h: string) => <th key={h} className="p-5 text-[9px] font-black uppercase text-slate-500 tracking-widest">{h}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50 border-b border-slate-50 transition-colors">
                            {headers.map((h: string) => (
                                <td key={h} className="p-5 text-xs font-bold text-slate-700">
                                    {renderCell(row, h.toLowerCase().replace(/\s+/g, ''))}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

function StudyPlanScreen() {
    const { plans, activePlanId, dispatch } = useStudyPlan();
    const { tasks, dispatch: tasksDispatch } = useTasks();
    const { addToast } = useToasts();
    const [isCreating, setIsCreating] = useState(false);

    const activePlan = useMemo(() => plans.find(p => p.id === activePlanId) || plans[0], [plans, activePlanId]);

    const activateMission = () => {
        if (!activePlan) return;
        activePlan.dailyBlocks.forEach((block, idx) => {
            tasksDispatch({
                type: TasksActionType.ADD_TASK,
                payload: {
                    id: `sync-${activePlan.id}-${idx}`,
                    text: `[Study] ${block.topic}`,
                    completed: false,
                    dueDate: block.date,
                    source: 'study_plan',
                    tips: block.tips,
                    youtubeSearch: block.youtubeSearch
                } as Task
            });
        });
        addToast("Mission synced to Calendar & Tasks.", "success", "Synced");
    };

    if (isCreating) {
        return (
            <div className="pb-20 pt-10">
                <button onClick={() => setIsCreating(false)} className="mb-6 flex items-center gap-2 font-black text-slate-400 text-[10px] uppercase tracking-widest hover:text-primary-500">
                    <ChevronLeftIcon className="w-4 h-4" /> Cancel Architect
                </button>
                <StudyPlanCreator onCreated={p => { dispatch({ type: StudyPlanActionType.ADD_PLAN, payload: p }); setIsCreating(false); }} />
            </div>
        );
    }

    const weekColors = ['bg-indigo-600', 'bg-violet-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600'];
    const dayColors: Record<string, string> = {
        'monday': 'text-blue-600 bg-blue-50/50',
        'tuesday': 'text-emerald-600 bg-emerald-50/50',
        'wednesday': 'text-amber-600 bg-amber-50/50',
        'thursday': 'text-orange-600 bg-orange-50/50',
        'friday': 'text-rose-600 bg-rose-50/50',
        'saturday': 'text-indigo-600 bg-indigo-50/50',
        'sunday': 'text-sky-600 bg-sky-50/50'
    };

    return (
        <div className="max-w-full mx-auto space-y-12 pb-20 px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Mission Control</h1>
                <Button onClick={() => setIsCreating(true)} className="rounded-2xl px-8 h-14 bg-primary-600 shadow-xl shadow-primary-500/40">
                    <SparklesIcon className="w-5 h-5 mr-3" />
                    <span className="text-[11px] font-black uppercase tracking-widest">New Strategy</span>
                </Button>
            </div>

            {activePlan && (
                <div className="space-y-12 animate-fade-in">
                    <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black uppercase tracking-tight">{activePlan.examName}</h2>
                            <div className="flex flex-wrap gap-6 mt-6">
                                <span className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400"><CalendarIcon className="w-4 h-4 text-primary-400" /> Starts: {activePlan.startDate}</span>
                                <span className="flex items-center gap-2 text-xs font-bold uppercase text-slate-400"><TrendingUpIcon className="w-4 h-4 text-primary-400" /> Goal: {activePlan.targetScore}</span>
                            </div>
                        </div>
                        <Button onClick={activateMission} className="h-14 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-500/30 border-none group transition-all">
                            <CheckBadgeIcon className="w-6 h-6 mr-2" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Deploy to Calendar</span>
                        </Button>
                        <button onClick={() => dispatch({ type: StudyPlanActionType.DELETE_PLAN, payload: activePlan.id })} className="absolute top-4 right-4 p-2 text-white/20 hover:text-rose-500"><TrashIcon className="w-5 h-5"/></button>
                    </div>

                    <DataTable 
                        title="WEEKLY ROADMAP" 
                        headers={['Week', 'Day', 'Date', 'Topic', 'Resources']}
                        rows={activePlan.masterPlan}
                        renderCell={(row: any, key: string) => {
                            if (key === 'week') {
                                const color = weekColors[(row.week - 1) % weekColors.length];
                                return <div className={`w-8 h-8 rounded-full ${color} text-white flex items-center justify-center font-black text-[10px]`}>W{row.week}</div>;
                            }
                            if (key === 'day') {
                                const dayKey = row.day.toLowerCase();
                                return <span className={`px-2 py-0.5 rounded font-black uppercase text-[9px] ${dayColors[dayKey] || 'text-slate-500 bg-slate-100'}`}>{row.day}</span>;
                            }
                            if (key === 'topic') return (
                                <div className="flex flex-col gap-1">
                                    <span className="font-black text-slate-900">{row.topic}</span>
                                    <span className="text-[10px] text-amber-600 italic font-bold">💡 {row.tips}</span>
                                </div>
                            );
                            if (key === 'resources') return <YouTubeSearchButton query={row.youtubeSearch} />;
                            return row[key];
                        }}
                    />

                    <DataTable 
                        title="DAILY FOCUS BLOCKS" 
                        headers={['Date', 'Time', 'Topic', 'Method', 'Resources']}
                        rows={activePlan.dailyBlocks}
                        renderCell={(row: any, key: string) => {
                            if (key === 'time') return <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded">{row.from} - {row.to}</span>;
                            if (key === 'topic') return <span className="font-black text-slate-800">{row.topic}</span>;
                            if (key === 'resources') return <YouTubeSearchButton query={row.youtubeSearch} />;
                            return row[key];
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default StudyPlanScreen;
