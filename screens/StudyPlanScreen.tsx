import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { useStudyPlan } from '../hooks/useStudyPlan';
import { StudyPlanActionType, StudyDay, StudyPlan, TasksActionType, Task, StudyResource } from '../types';
import { generateStudyPlan } from '../services/geminiService';
import { useTasks } from '../hooks/useTasks';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { CheckBadgeIcon } from '../components/icons/CheckBadgeIcon';
import { parseFileToText } from '../utils/fileParser';
import { YouTubeIcon } from '../components/icons/YouTubeIcon';
import { PdfIcon } from '../components/icons/PdfIcon';
import { LinkIcon } from '../components/icons/LinkIcon';
import jsPDF from 'jspdf';
import { DownloadIcon } from '../components/icons/DownloadIcon';
import { useDropzone } from 'react-dropzone';


const CreatePlanForm = ({ onPlanCreated }: { onPlanCreated: (plan: StudyPlan) => void }) => {
    const { loading, error, dispatch } = useStudyPlan();
    const [isParsingFile, setIsParsingFile] = useState(false);
    const [inputMode, setInputMode] = useState('describe'); // describe, list, upload
    const [formData, setFormData] = useState({
        subject: '', goal: '', topics: '', fileContent: '', fileName: '',
        examDate: '',
        studyDays: [] as string[],
        hours: '2',
        includeReviews: true,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFile = async (file: File) => {
        if (file) {
            setIsParsingFile(true);
            dispatch({ type: StudyPlanActionType.SET_ERROR, payload: null });
            try {
                const content = await parseFileToText(file);
                setFormData(prev => ({...prev, fileContent: content, fileName: file.name}));
            } catch (err: any) {
                dispatch({ type: StudyPlanActionType.SET_ERROR, payload: err.message });
            } finally {
                setIsParsingFile(false);
            }
        }
    };

    const onDrop = (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            handleFile(acceptedFiles[0]);
        }
    };
    
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: false,
        accept: {
          'text/plain': ['.txt'],
          'application/pdf': ['.pdf'],
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        },
        disabled: isParsingFile || loading,
    });

    const handleDaysChange = (day: string) => {
        setFormData(prev => {
            const newDays = prev.studyDays.includes(day)
                ? prev.studyDays.filter(d => d !== day)
                : [...prev.studyDays, day];
            return { ...prev, studyDays: newDays };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        dispatch({ type: StudyPlanActionType.SET_LOADING, payload: true });
        dispatch({ type: StudyPlanActionType.SET_ERROR, payload: null });
        try {
            const planData = await generateStudyPlan({ ...formData, inputMode });
            const newPlan: StudyPlan = {
                ...planData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
            };
            onPlanCreated(newPlan);
        } catch (err: any) {
            dispatch({ type: StudyPlanActionType.SET_ERROR, payload: err.message });
        }
    };
    
    return (
        <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium">How do you want to provide study material?</label>
                    <div className="flex gap-2 mt-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                        <Button type="button" size="sm" variant={inputMode === 'describe' ? 'primary' : 'secondary'} onClick={() => setInputMode('describe')}>Describe</Button>
                        <Button type="button" size="sm" variant={inputMode === 'list' ? 'primary' : 'secondary'} onClick={() => setInputMode('list')}>List Topics</Button>
                        <Button type="button" size="sm" variant={inputMode === 'upload' ? 'primary' : 'secondary'} onClick={() => setInputMode('upload')}>Upload File</Button>
                    </div>
                </div>

                {inputMode === 'describe' && (
                    <>
                        <div><label className="block text-sm font-medium">Subject/Topic</label><input type="text" name="subject" value={formData.subject} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" required /></div>
                        <div><label className="block text-sm font-medium">Study Goal</label><input type="text" name="goal" value={formData.goal} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" placeholder="e.g., Pass the final exam" required /></div>
                    </>
                )}
                {inputMode === 'list' && <div><label className="block text-sm font-medium">Topics/Lectures</label><textarea name="topics" rows={5} value={formData.topics} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" placeholder="Enter one topic per line..." required /></div>}
                {inputMode === 'upload' && (
                    <div>
                        <label className="block text-sm font-medium mb-1">Syllabus or Notes File</label>
                        <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'}`}>
                            <input {...getInputProps()} required={!formData.fileName} />
                            <p className="text-slate-500 dark:text-slate-400">
                                {isDragActive ? 'Drop the file here...' : 'Drag & drop a file, or click to select'}
                            </p>
                            <p className="text-xs text-slate-400">(.pdf, .docx, .txt)</p>
                        </div>
                        {isParsingFile && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                                <svg className="animate-spin h-4 w-4 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Parsing file...</span>
                            </div>
                        )}
                        {!isParsingFile && formData.fileName && (
                            <p className="mt-2 text-sm text-green-600">
                                ✓ Loaded: {formData.fileName}
                            </p>
                        )}
                    </div>
                )}

                 <div><label className="block text-sm font-medium">Final Exam Date</label><input type="date" name="examDate" value={formData.examDate} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600" required /></div>
                 <div>
                    <label className="block text-sm font-medium">Available Days</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                       {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (<label key={day} className={`px-3 py-1 rounded-full cursor-pointer text-sm ${formData.studyDays.includes(day) ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}><input type="checkbox" className="hidden" onChange={() => handleDaysChange(day)} />{day}</label>))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium">Daily Study Time (hours)</label>
                    <select name="hours" value={formData.hours} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600">
                        <option value="1">1 hour</option>
                        <option value="2">2 hours</option>
                        <option value="3">3 hours</option>
                        <option value="4">4 hours</option>
                        <option value="5">5 hours</option>
                        <option value="6">6 hours</option>
                        <option value="7">7 hours</option>
                        <option value="8">8 hours</option>
                    </select>
                </div>
                 <div className="flex items-center gap-2"><input type="checkbox" id="include-reviews" name="includeReviews" checked={formData.includeReviews} onChange={e => setFormData(p => ({...p, includeReviews: e.target.checked}))} /><label htmlFor="include-reviews">Include review sessions</label></div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <Button type="submit" size="lg" className="w-full" disabled={loading || isParsingFile}>
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    <span>Generate Plan</span>
                </Button>
            </form>
        </Card>
    );
};

const ResourceLink = ({ resource }: { resource: StudyResource }) => {
    let href = resource.url || '#';
    if (resource.searchQuery) {
        href = `https://www.youtube.com/results?search_query=${encodeURIComponent(resource.searchQuery)}`;
    }

    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-500 hover:underline">
            <ResourceIcon type={resource.type} />
            <span className="truncate" title={resource.title}>{resource.title}</span>
            <span className="text-xs text-slate-400 flex-shrink-0">({resource.source})</span>
        </a>
    );
};


const ResourceIcon = ({ type }: { type: StudyResource['type'] }) => {
  switch (type) {
    case 'video':
      return <YouTubeIcon className="w-4 h-4 text-red-500 flex-shrink-0" />;
    case 'article':
      return <LinkIcon className="w-4 h-4 text-sky-500 flex-shrink-0" />;
    case 'pdf':
      return <PdfIcon className="w-4 h-4 flex-shrink-0" />;
    default:
      return <LinkIcon className="w-4 h-4 text-slate-500 flex-shrink-0" />;
  }
};

const PlanDetails = ({ plan }: { plan: StudyPlan }) => {
    const planStartDate = useMemo(() => {
        const date = new Date(plan.createdAt);
        date.setHours(0, 0, 0, 0); // Normalize to midnight
        return date;
    }, [plan.createdAt]);

    const startOfWeekDate = useMemo(() => {
        const start = new Date(planStartDate);
        const dayOfWeek = (start.getDay() + 6) % 7; // Monday = 0, Sunday = 6
        start.setDate(start.getDate() - dayOfWeek);
        return start;
    }, [planStartDate]);

    const renderDay = (day: StudyDay, weekIndex: number, dayIndex: number) => {
        const currentDayDate = new Date(startOfWeekDate);
        currentDayDate.setDate(startOfWeekDate.getDate() + (weekIndex * 7) + dayIndex);

        const formattedDate = currentDayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        return (
            <div key={`${weekIndex}-${day.dayOfWeek}`} className={`p-4 rounded-lg ${day.isRestDay ? 'bg-slate-100 dark:bg-slate-800/50' : 'bg-white dark:bg-slate-700/50'}`}>
                <h4 className="font-bold">{day.dayOfWeek}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{formattedDate}</p>
                {day.isRestDay ? (<p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Rest Day</p>) : (
                    <ul className="mt-2 space-y-3 text-sm">{day.tasks.map((task, taskIndex) => (
                        <li key={taskIndex} className="flex flex-col items-start gap-2">
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-1.5 flex-shrink-0"></div>
                                <span>{task.task} <em className="text-slate-400">({task.duration} min)</em></span>
                            </div>
                            {task.resources && task.resources.length > 0 && (
                                <ul className="pl-5 pt-1 space-y-1 w-full border-l border-slate-200 dark:border-slate-600">
                                    {task.resources.map((resource, resourceIndex) => (
                                        <li key={resourceIndex}>
                                            <ResourceLink resource={resource} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>))}
                    </ul>
                )}
            </div>
        );
    };
    return (
        <div className="space-y-4 mt-4">
            {plan.weeks.map(week => (
                <div key={week.weekNumber}>
                    <h3 className="text-xl font-bold mb-2">Week {week.weekNumber}</h3>
                    <p className="text-slate-600 dark:text-slate-300 mb-4">{week.weeklyGoal}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
                        {week.days.map((day, dayIndex) => renderDay(day, week.weekNumber - 1, dayIndex))}
                    </div>
                </div>
            ))}
            {plan.groundingMetadata && plan.groundingMetadata.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">مصدر استعان به الذكاء الاصطناعي:</h4>
                    <ul className="list-disc list-inside text-xs space-y-1">
                        {plan.groundingMetadata.filter(chunk => chunk.web).map((chunk, index) => (
                            <li key={index}>
                                <a href={chunk.web!.uri} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                    {chunk.web!.title || chunk.web!.uri}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

function StudyPlanScreen() {
    const { plans, activePlanId, dispatch, loading } = useStudyPlan();
    const { dispatch: tasksDispatch } = useTasks();
    const [view, setView] = useState<'dashboard' | 'create'>('dashboard');

    useEffect(() => {
        // This effect runs when the active plan changes.
        // It's responsible for syncing tasks.
        if (!activePlanId) {
            // If no plan is active, we might want to clear all plan-related tasks.
            // Let's find all tasks that come from ANY plan and remove them.
            const allPlanIds = plans.map(p => p.id);
            allPlanIds.forEach(planId => {
                 tasksDispatch({ type: TasksActionType.DELETE_PLAN_TASKS, payload: planId });
            });
            return;
        };

        const activePlan = plans.find(p => p.id === activePlanId);
        if (!activePlan) return;

        // 1. Clear tasks from any OTHER plan that might be present.
        plans.forEach(p => {
            if (p.id !== activePlanId) {
                tasksDispatch({ type: TasksActionType.DELETE_PLAN_TASKS, payload: p.id });
            }
        });

        // 2. Calculate and add tasks for the new active plan
        const planStartDate = new Date(activePlan.createdAt);
        const newTasks: Task[] = [];
        
        // This date logic is simplified. A real-world app would need a more robust library.
        const dayMap = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        activePlan.weeks.forEach((week, weekIndex) => {
            week.days.forEach((day) => {
                const dayOfWeekIndex = dayMap.indexOf(day.dayOfWeek);
                if (dayOfWeekIndex === -1) return;

                const dayOffset = (weekIndex * 7) + dayOfWeekIndex - new Date(activePlan.createdAt).getDay();
                
                const taskDate = new Date(planStartDate);
                taskDate.setDate(planStartDate.getDate() + dayOffset);


                if (!day.isRestDay) {
                    day.tasks.forEach(t => {
                        const taskId = `${activePlan.id}-${taskDate.toISOString().split('T')[0]}-${t.task.slice(0, 10)}`;
                        newTasks.push({
                            id: taskId,
                            text: t.task,
                            completed: false,
                            dueDate: taskDate.toISOString().split('T')[0],
                            source: 'study_plan',
                            planId: activePlan.id,
                        });
                    });
                }
            });
        });
        
        // Use a batch add if available, otherwise one by one.
        // Adding one by one might cause many re-renders, but is simpler to implement.
        // To avoid duplicates, we can first clear all tasks for this plan ID and then add them all.
        tasksDispatch({ type: TasksActionType.DELETE_PLAN_TASKS, payload: activePlanId });
        newTasks.forEach(task => tasksDispatch({ type: TasksActionType.ADD_TASK, payload: task }));

    }, [activePlanId, plans, tasksDispatch]);

    const handlePlanCreated = (newPlan: StudyPlan) => {
        dispatch({ type: StudyPlanActionType.ADD_PLAN, payload: newPlan });
        setView('dashboard');
    };

    const handleDeletePlan = (planId: string) => {
        if (window.confirm("Are you sure you want to delete this plan and all its associated tasks?")) {
            tasksDispatch({ type: TasksActionType.DELETE_PLAN_TASKS, payload: planId });
            dispatch({ type: StudyPlanActionType.DELETE_PLAN, payload: planId });
        }
    };

    const handleDownloadPdf = (plan: StudyPlan) => {
        const doc = new jsPDF();
        let y = 20;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 10;
        const pageWidth = doc.internal.pageSize.width;
        const contentWidth = pageWidth - (margin * 2);

        const checkPageBreak = (spaceNeeded: number) => {
            if (y + spaceNeeded > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
        };

        // Title
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        const titleLines = doc.splitTextToSize(plan.planTitle, contentWidth);
        doc.text(titleLines, margin, y);
        y += (titleLines.length * 7) + 5;
        doc.setFont('helvetica', 'normal');

        plan.weeks.forEach(week => {
            checkPageBreak(15);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`Week ${week.weekNumber}:`, margin, y);
            y += 6;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            const goalLines = doc.splitTextToSize(week.weeklyGoal, contentWidth);
            doc.text(goalLines, margin, y);
            y += (goalLines.length * 5) + 5;
            doc.setFont('helvetica', 'normal');

            week.days.forEach(day => {
                checkPageBreak(12);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(day.dayOfWeek, margin, y);
                y += 6;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);

                if (day.isRestDay) {
                    doc.text('Rest Day', margin + 5, y);
                    y += 7;
                } else {
                    day.tasks.forEach(task => {
                        checkPageBreak(10);
                        const taskText = `- ${task.task} (${task.duration} mins)`;
                        const taskLines = doc.splitTextToSize(taskText, contentWidth - 5);
                        doc.text(taskLines, margin + 5, y);
                        y += (taskLines.length * 5);

                        task.resources?.forEach(resource => {
                            checkPageBreak(5);
                            let url = resource.url;
                            if (resource.searchQuery) {
                                url = `https://www.youtube.com/results?search_query=${encodeURIComponent(resource.searchQuery)}`;
                            }

                            if (url) {
                                doc.setTextColor(0, 0, 255);
                                const resourceLines = doc.splitTextToSize(`  • ${resource.title} (${resource.source})`, contentWidth - 10);
                                try {
                                    doc.textWithLink(resourceLines[0], margin + 10, y, { url });
                                    if (resourceLines.length > 1) {
                                         doc.text(resourceLines.slice(1), margin + 10, y + 5);
                                    }
                                } catch (e) {
                                    // Fallback for long links that jspdf might struggle with
                                    doc.text(resourceLines, margin + 10, y);
                                }
                                doc.setTextColor(0, 0, 0);
                                y += (resourceLines.length * 5);
                            }
                        });
                        y += 3;
                    });
                }
            });
            y += 5; // Extra space between weeks
        });
        
        doc.save(`${plan.planTitle.replace(/\s/g, '_')}.pdf`);
    };
    
    if (loading && view === 'create') {
        return (
            <div className="max-w-2xl mx-auto text-center">
                <Card>
                    <Loader text="جاري إنشاء خطتك الدراسية..." />
                    <SparklesIcon className="w-12 h-12 mx-auto text-primary-500 my-4 animate-pulse" />
                    <p className="text-slate-600 dark:text-slate-300">
                        يقوم الذكاء الاصطناعي الآن بالبحث عن أفضل المصادر التعليمية ومقاطع الفيديو لمساعدتك.
                        <br />
                        قد تستغرق هذه العملية دقيقة أو دقيقتين.
                    </p>
                </Card>
            </div>
        );
    }
    
    if (view === 'create') {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold">Create a New Study Plan</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Let AI build a schedule tailored to your needs.</p>
                </div>
                <CreatePlanForm onPlanCreated={handlePlanCreated} />
                <Button variant="secondary" onClick={() => setView('dashboard')} className="mt-4">Back to Dashboard</Button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold">Your Study Plans</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your study schedules and set an active plan.</p>
            </div>
            
            <div className="text-center">
                <Button onClick={() => setView('create')} size="lg">
                    <SparklesIcon className="w-5 h-5 mr-2" />
                    Create New Plan
                </Button>
            </div>

            {plans.length > 0 ? (
                <div className="space-y-4">
                    {plans.map(plan => (
                        <div key={plan.id}>
                            <Card>
                                <details className="group">
                                    <summary className="list-none flex justify-between items-center cursor-pointer">
                                        <div className="flex items-center gap-3">
                                           {activePlanId === plan.id && <CheckBadgeIcon className="w-6 h-6 text-green-500" title="Active Plan" />}
                                           <div>
                                                <h2 className="text-xl font-bold">{plan.planTitle}</h2>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Created: {new Date(plan.createdAt).toLocaleDateString()}</p>
                                           </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button onClick={(e) => { e.preventDefault(); handleDownloadPdf(plan); }} variant="secondary" size="sm" className="!p-2"><DownloadIcon className="w-4 h-4" /></Button>
                                            <Button onClick={(e) => { e.preventDefault(); handleDeletePlan(plan.id); } } variant="danger" size="sm" className="!p-2"><TrashIcon className="w-4 h-4" /></Button>
                                            <Button onClick={(e) => { e.preventDefault(); dispatch({ type: StudyPlanActionType.SET_ACTIVE_PLAN, payload: plan.id }); } } disabled={activePlanId === plan.id} size="sm">Set as Active</Button>
                                        </div>
                                    </summary>
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <PlanDetails plan={plan} />
                                    </div>
                                </details>
                            </Card>
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="text-center py-12">
                     <ClipboardListIcon className="w-16 h-16 mx-auto text-slate-400" />
                     <h2 className="text-2xl font-bold mt-4">No Plans Yet</h2>
                     <p className="text-slate-500 dark:text-slate-400 mt-2">Create your first AI-powered study plan to get started.</p>
                </Card>
            )}
        </div>
    );
}

export default StudyPlanScreen;