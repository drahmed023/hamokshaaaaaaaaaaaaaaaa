
import React, { useState, useMemo } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { useStudyPlan } from '../hooks/useStudyPlan';
import { StudyPlanActionType, StudyPlan, StudyResource, StudyDay, StudyTask } from '../types';
import { generateStudyPlan, generateSimpleStudyTable, generateHybridStudyTable } from '../services/geminiService';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { YouTubeIcon } from '../components/icons/YouTubeIcon';
import { LinkIcon } from '../components/icons/LinkIcon';
import { PdfIcon } from '../components/icons/PdfIcon';
import { GridIcon } from '../components/icons/GridIcon';
import { CheckBadgeIcon } from '../components/icons/CheckBadgeIcon';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { useDropzone } from 'react-dropzone';
import { parseFileToText } from '../utils/fileParser';
import jsPDF from 'jspdf';
import { StudyPlanTableView } from '../components/StudyPlanTableView';


const CreatePlanForm = ({ onPlanCreated }: { onPlanCreated: (plan: StudyPlan) => void }) => {
    const { loading, dispatch } = useStudyPlan();
    const [subject, setSubject] = useState('');
    const [hours, setHours] = useState('2');
    const [studyDays, setStudyDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']);
    const [topics, setTopics] = useState('');
    const [planType, setPlanType] = useState<'comprehensive' | 'simple' | 'hybrid'>('hybrid');
    const [parsingFile, setParsingFile] = useState(false);

    const toggleDay = (day: string) => {
        setStudyDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const handleFile = async (file: File) => {
        setParsingFile(true);
        try {
            const content = await parseFileToText(file);
            setTopics(content);
        } catch (err) {
            alert("Could not parse file.");
        } finally {
            setParsingFile(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (files) => handleFile(files[0]),
        multiple: false,
        accept: { 'application/pdf': ['.pdf'], 'text/plain': ['.txt'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: StudyPlanActionType.SET_LOADING, payload: true });
        try {
            let newPlan: StudyPlan;
            if (planType === 'comprehensive') {
                const planData = await generateStudyPlan({ subject, studyDays, hours, topics });
                newPlan = { ...planData, id: Date.now().toString(), type: 'comprehensive', createdAt: new Date().toISOString() };
            } else if (planType === 'simple') {
                const planData = await generateSimpleStudyTable({ subject, topics });
                newPlan = { ...planData, id: Date.now().toString(), type: 'simple', createdAt: new Date().toISOString() };
            } else {
                const planData = await generateHybridStudyTable({ subject, topics, preferredDays: studyDays });
                newPlan = { ...planData, id: Date.now().toString(), type: 'hybrid', createdAt: new Date().toISOString() };
            }
            onPlanCreated(newPlan);
        } catch (err: any) {
            alert(err.message);
        } finally {
            dispatch({ type: StudyPlanActionType.SET_LOADING, payload: false });
        }
    };

    return (
        <Card className="max-w-xl mx-auto border-none shadow-xl" dir="ltr">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">New Schedule</h2>
                    <p className="text-slate-400 mt-1 font-bold text-[10px] uppercase tracking-widest opacity-60">Design your academic grid with AI</p>
                </div>

                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <button
                        type="button"
                        onClick={() => setPlanType('simple')}
                        className={`flex flex-col items-center gap-1 py-3 rounded-lg transition-all ${planType === 'simple' ? 'bg-white dark:bg-slate-700 shadow-md text-primary-600' : 'text-slate-500'}`}
                    >
                        <GridIcon className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Simple</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setPlanType('hybrid')}
                        className={`flex flex-col items-center gap-1 py-3 rounded-lg transition-all ${planType === 'hybrid' ? 'bg-white dark:bg-slate-700 shadow-md text-primary-600' : 'text-slate-500'}`}
                    >
                        <SparklesIcon className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Grid View</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setPlanType('comprehensive')}
                        className={`flex flex-col items-center gap-1 py-3 rounded-lg transition-all ${planType === 'comprehensive' ? 'bg-white dark:bg-slate-700 shadow-md text-primary-600' : 'text-slate-500'}`}
                    >
                        <ClipboardListIcon className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Weekly</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                        <input className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-primary-500/20 outline-none transition-all font-bold text-xs" placeholder="e.g., Clinical Exam" value={subject} onChange={e => setSubject(e.target.value)} required />
                    </div>
                    {planType === 'comprehensive' && (
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Hours / Day</label>
                            <input type="number" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 ring-primary-500/20 outline-none transition-all font-bold text-xs" value={hours} onChange={e => setHours(e.target.value)} min="1" max="12" required />
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Materials / Topics</label>
                    {topics ? (
                        <div className="relative group">
                            <textarea rows={4} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium leading-relaxed resize-none" value={topics} onChange={e => setTopics(e.target.value)} />
                            <button type="button" onClick={() => setTopics('')} className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded-lg hover:scale-110 transition-all shadow-sm">
                                <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-primary-400 hover:bg-slate-50/50'}`}>
                            <input {...getInputProps()} />
                            <DownloadIcon className="w-8 h-8 mx-auto text-primary-500 mb-2" />
                            <span className="font-black text-sm text-slate-800 dark:text-slate-100 block">Drop Curriculum Here</span>
                            <p className="text-[9px] text-slate-400 mt-1 uppercase tracking-widest font-black opacity-60">Upload PDF or Paste Text</p>
                        </div>
                    )}
                </div>

                <Button type="submit" size="md" className="w-full rounded-xl h-12 shadow-lg shadow-primary-500/20" disabled={loading || parsingFile}>
                    {loading ? <Loader text="Drafting..." /> : (
                        <div className="flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest">Generate Schedule</span>
                        </div>
                    )}
                </Button>
            </form>
        </Card>
    );
};

function StudyPlanScreen() {
    const { plans, activePlanId, dispatch } = useStudyPlan();
    const [view, setView] = useState<'list' | 'create'>('list');

    const activePlan = plans.find(p => p.id === activePlanId) || plans[0];

    // Mock dates for the weekly board
    const getMockDate = (dayIndex: number) => {
        const dates = ['Jan 5', 'Jan 6', 'Jan 7', 'Jan 8', 'Jan 9', 'Jan 10', 'Jan 11'];
        return dates[dayIndex % 7];
    };

    const deletePlan = (id: string) => {
        if (window.confirm('Delete this plan?')) {
            dispatch({ type: StudyPlanActionType.DELETE_PLAN, payload: id });
        }
    };

    const downloadAsPdf = () => {
        if (!activePlan) return;
        const doc = new jsPDF('landscape');
        doc.setFontSize(22);
        doc.text(activePlan.planTitle, 15, 25);
        doc.save(`${activePlan.planTitle}.pdf`);
    };

    if (view === 'create') {
        return (
            <div className="py-6 max-w-4xl mx-auto px-4">
                <button onClick={() => setView('list')} className="mb-4 flex items-center gap-2 font-black text-slate-400 text-[10px] uppercase tracking-widest hover:text-primary-500 transition-all group">
                    <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Library
                </button>
                <CreatePlanForm onPlanCreated={(plan) => {
                    dispatch({ type: StudyPlanActionType.ADD_PLAN, payload: plan });
                    setView('list');
                }} />
            </div>
        );
    }

    return (
        <div className="max-w-full mx-auto space-y-6 pb-20 px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-7xl mx-auto w-full">
                <div className="text-center md:text-left w-full">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">WEEKLY PLANNER</h1>
                    <p className="text-slate-400 mt-1 font-bold uppercase text-[9px] tracking-[0.4em] opacity-40">Academic Board View</p>
                </div>
                <Button onClick={() => setView('create')} className="rounded-xl h-10 px-6 shadow-md shadow-primary-500/20 group whitespace-nowrap bg-primary-600 hover:bg-primary-500 border-none transition-all">
                    <SparklesIcon className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] uppercase tracking-widest font-black">New Schedule</span>
                </Button>
            </div>

            {plans.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Sidebar Library */}
                    <div className="lg:col-span-3 space-y-4">
                        <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Saved Drafts</h2>
                        <div className="space-y-2">
                            {plans.map(plan => (
                                <button
                                    key={plan.id}
                                    onClick={() => dispatch({ type: StudyPlanActionType.SET_ACTIVE_PLAN, payload: plan.id })}
                                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group overflow-hidden ${activePlanId === plan.id ? 'border-primary-500 bg-white dark:bg-slate-800 shadow-lg shadow-primary-500/10' : 'border-transparent bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100'}`}
                                >
                                    <div className="truncate pr-2">
                                        <p className={`font-black text-[11px] truncate uppercase tracking-widest ${activePlanId === plan.id ? 'text-primary-600' : 'text-slate-700 dark:text-slate-300'}`}>{plan.planTitle}</p>
                                        <p className="text-[8px] text-slate-400 font-bold mt-0.5 uppercase">{plan.type} mode</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }} className="p-1 text-slate-300 hover:text-red-500 transition-colors">
                                        <TrashIcon className="w-3.5 h-3.5" />
                                    </button>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Board Area */}
                    <div className="lg:col-span-9 bg-white dark:bg-slate-950 rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                        {activePlan && (
                            <div className="space-y-6 animate-fade-in" dir="ltr">
                                {/* Dashboard Top Bar */}
                                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-4 border-b border-slate-50 dark:border-slate-800">
                                    <div className="space-y-0.5">
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{activePlan.planTitle}</h2>
                                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">
                                            Created: {new Date(activePlan.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                        <Button onClick={downloadAsPdf} variant="secondary" size="sm" className="rounded-lg h-8 w-8 !p-0 shadow-sm border-slate-200">
                                            <DownloadIcon className="w-4 h-4 text-slate-600" />
                                        </Button>
                                        <Button onClick={() => deletePlan(activePlan.id)} variant="secondary" size="sm" className="rounded-lg h-8 w-8 !p-0 shadow-sm border-slate-200 text-red-500">
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                        <Button variant="primary" size="sm" className="rounded-lg h-8 px-4 shadow-md bg-emerald-600 hover:bg-emerald-700 border-none transition-all">
                                            <span className="text-[10px] uppercase font-black tracking-widest text-white">Set as Active</span>
                                        </Button>
                                    </div>
                                </div>
                                
                                {activePlan.weeks && activePlan.weeks.length > 0 ? (
                                    <StudyPlanTableView
                                        title={activePlan.planTitle}
                                        createdDate={activePlan.createdAt}
                                        weeks={activePlan.weeks}
                                    />
                                ) : activePlan.rows && activePlan.rows.length > 0 ? (
                                    <StudyPlanTableView
                                        title={activePlan.planTitle}
                                        createdDate={activePlan.createdAt}
                                        weeks={[{
                                            weekNumber: 1,
                                            weeklyGoal: 'Complete study topics',
                                            days: Array.from({ length: 7 }).map((_, idx) => ({
                                                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][idx],
                                                isRestDay: false,
                                                tasks: activePlan.rows
                                                    .filter((row, rIdx) => rIdx % 7 === idx)
                                                    .map(row => ({
                                                        task: row.topic,
                                                        duration: row.duration || 45,
                                                        resources: row.resource ? [row.resource] : []
                                                    }))
                                            }))
                                        }]}
                                    />
                                ) : (
                                    <div className="py-20 text-center text-slate-400">
                                        <ClipboardListIcon className="w-10 h-10 mx-auto mb-4 opacity-10" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">No schedule data available.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="py-24 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700 shadow-sm">
                        <ClipboardListIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Empty Board</h3>
                    <p className="text-slate-500 mt-2 max-w-xs text-[10px] font-bold uppercase tracking-widest opacity-60 leading-relaxed">Import your materials to draft your first intelligent academic roadmap.</p>
                    <Button onClick={() => setView('create')} className="mt-8 rounded-lg px-8 h-12 bg-primary-600 hover:bg-primary-500 border-none shadow-lg">
                        <span className="text-[11px] font-black uppercase tracking-widest">Build First Schedule</span>
                    </Button>
                </div>
            )}
        </div>
    );
}

export default StudyPlanScreen;
