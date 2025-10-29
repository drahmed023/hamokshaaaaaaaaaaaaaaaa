





import React, { useState } from 'react';
import { useStudyPlan } from '../hooks/useStudyPlan';
import { generateStudyPlan } from '../services/geminiService';
import { StudyPlan, StudyPlanActionType, TasksActionType, Task } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Loader from '../components/Loader';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { useTasks } from '../hooks/useTasks';

function RenderPlanGenerator({ onGenerate }: { onGenerate: (subject: string, goal: string, weeks: number, hours: number) => void }) {
    const [subject, setSubject] = useState('');
    const [goal, setGoal] = useState('');
    const [weeks, setWeeks] = useState(4);
    const [hours, setHours] = useState(2);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(subject, goal, weeks, hours);
    };

    return (
        // Fix: Added children to Card component to resolve missing prop error.
        <Card>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Create Your AI-Powered Study Plan</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Tell us your goals, and we'll map out your path to success.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject(s)</label>
                    <input type="text" id="subject" value={subject} onChange={e => setSubject(e.target.value)} required placeholder="e.g., Mathematics, React Development" className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                </div>
                <div>
                    <label htmlFor="goal" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Main Goal</label>
                    <input type="text" id="goal" value={goal} onChange={e => setGoal(e.target.value)} required placeholder="e.g., Pass the final exam, Build a portfolio project" className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="weeks" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Study Duration (weeks)</label>
                        <input type="number" id="weeks" value={weeks} onChange={e => setWeeks(Number(e.target.value))} min="1" max="52" required className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                    <div>
                        <label htmlFor="hours" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hours per Day (approx.)</label>
                        <input type="number" id="hours" value={hours} onChange={e => setHours(Number(e.target.value))} min="1" max="12" required className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600" />
                    </div>
                </div>
                <div className="pt-2">
                    {/* Fix: Added children to Button component to resolve missing prop error. */}
                    <Button type="submit" size="lg" className="w-full">
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        Generate Plan
                    </Button>
                </div>
            </form>
        </Card>
    );
};

function RenderStudyPlan({ plan, onClear }: { plan: StudyPlan; onClear: () => void }) {
    const [activeWeek, setActiveWeek] = useState(0);
    const priorityColors = {
        High: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
        Medium: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200',
        Low: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200',
    };
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-3xl font-bold">{plan.planTitle}</h1>
            </div>

            <div className="flex flex-wrap justify-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {plan.weeks.map((week, index) => (
                    <React.Fragment key={index}>
                        {/* Fix: Added children to Button component to resolve missing prop error. */}
                        <Button variant={activeWeek === index ? 'primary' : 'secondary'} onClick={() => setActiveWeek(index)}>
                            Week {week.weekNumber}
                        </Button>
                    </React.Fragment>
                ))}
            </div>

            {/* Fix: Added children to Card component to resolve missing prop error. */}
            <Card>
                <div className="text-center mb-4">
                    <h3 className="text-xl font-bold">Week {plan.weeks[activeWeek].weekNumber} Goal</h3>
                    <p className="text-slate-500 dark:text-slate-400">{plan.weeks[activeWeek].weeklyGoal}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plan.weeks[activeWeek].days.map((day) => (
                        <div key={day.dayOfWeek} className={`p-4 rounded-lg ${day.isRestDay ? 'bg-green-50 dark:bg-green-900/30' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                            <h4 className="font-bold">{day.dayOfWeek}</h4>
                            {day.isRestDay ? (
                                <p className="mt-2 text-green-700 dark:text-green-300">Rest Day</p>
                            ) : (
                                <ul className="mt-2 space-y-2">
                                    {day.tasks.map((task, i) => (
                                        <li key={i} className="p-2 bg-white dark:bg-slate-700 rounded-md shadow-sm">
                                            <p className="font-medium text-sm">{task.task}</p>
                                            <div className="flex justify-between items-center text-xs mt-1 text-slate-500 dark:text-slate-400">
                                                <span>{task.duration} mins</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColors[task.priority]}`}>{task.priority}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            <div className="text-center">
                {/* Fix: Added children to Button component to resolve missing prop error. */}
                <Button onClick={onClear} variant="secondary">Create a New Plan</Button>
            </div>
        </div>
    );
};

function StudyPlanScreen() {
    const { plan, loading, error, dispatch } = useStudyPlan();
    const { dispatch: tasksDispatch } = useTasks();

    const handleGenerate = async (subject: string, goal: string, weeks: number, hours: number) => {
        dispatch({ type: StudyPlanActionType.SET_LOADING, payload: true });
        try {
            const planData = await generateStudyPlan(subject, goal, weeks, hours);
            const startDate = new Date();
            const newPlan: StudyPlan = {
                ...planData,
                id: Date.now().toString(),
                startDate: startDate.toISOString(),
            };
            dispatch({ type: StudyPlanActionType.SET_PLAN, payload: newPlan });

            // Add plan tasks to the main tasks list
            let dayOffset = 0;
            newPlan.weeks.forEach(week => {
                week.days.forEach(day => {
                    const taskDate = new Date(startDate);
                    taskDate.setDate(startDate.getDate() + dayOffset);
                    if (!day.isRestDay) {
                        day.tasks.forEach(studyTask => {
                            const newTask: Task = {
                                id: `${newPlan.id}-${week.weekNumber}-${day.dayOfWeek}-${studyTask.task.slice(0, 10)}`,
                                text: studyTask.task,
                                completed: false,
                                dueDate: taskDate.toISOString().split('T')[0],
                                source: 'study_plan',
                            };
                            tasksDispatch({ type: TasksActionType.ADD_TASK, payload: newTask });
                        });
                    }
                    dayOffset++;
                })
            });

        } catch (err: any) {
            dispatch({ type: StudyPlanActionType.SET_ERROR, payload: err.message });
        }
    };
    
    const handleClearPlan = () => {
        if (window.confirm('Are you sure you want to discard this plan and create a new one? This will not remove created tasks.')) {
            dispatch({ type: StudyPlanActionType.CLEAR_PLAN });
        }
    };
    
    if (loading) {
        return <Loader text="Building your personalized plan... This may take a moment." />;
    }

    return (
        <div className="max-w-6xl mx-auto">
            {error && <div className="mb-4 text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">{error}</div>}
            
            {plan && !error ? (
                <RenderStudyPlan plan={plan} onClear={handleClearPlan} />
            ) : (
                <RenderPlanGenerator onGenerate={handleGenerate} />
            )}
        </div>
    );
};

export default StudyPlanScreen;