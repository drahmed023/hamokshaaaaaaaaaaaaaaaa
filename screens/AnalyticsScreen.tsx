import React, { useState, useEffect, useMemo } from 'react';
import { useExam } from '../hooks/useExam';
import { categorizeSubjects, getMotivationalInsight } from '../services/geminiService';
import Card from '../components/Card';
import Loader from '../components/Loader';
// FIX: Updated to use renamed ExamActionType to avoid type conflicts.
import { ExamActionType, Exam } from '../types';

const Heatmap: React.FC<{ data: { [date: string]: number } }> = ({ data }) => {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1); // Go back 6 months
    const weeks: Date[][] = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - currentDate.getDay()); // Start on Sunday

    for (let i = 0; i < 26; i++) { // 26 weeks
        const week: Date[] = [];
        for (let j = 0; j < 7; j++) {
            week.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        weeks.push(week);
    }
    
    // Fix: Cast Object.values(data) to number[] to satisfy Math.max, which expects number arguments.
    // This resolves the error where TypeScript infers the values as 'unknown'.
    const maxCount = Math.max(1, ...Object.values(data) as number[]);

    const getColor = (count: number) => {
        if (count === 0) return 'bg-slate-100 dark:bg-slate-700/50';
        const opacity = Math.min(0.2 + (count / maxCount) * 0.8, 1);
        return `bg-primary-500`;
    };

    return (
        <div className="flex justify-start gap-1 overflow-x-auto p-2">
            {weeks.map((week, i) => (
                <div key={i} className="grid grid-rows-7 gap-1">
                    {week.map((day, j) => {
                        const dateString = day.toISOString().split('T')[0];
                        const count = data[dateString] || 0;
                        const colorClass = count > 0 ? getColor(count) : 'bg-slate-200 dark:bg-slate-700';
                        const opacity = count > 0 ? Math.max(0.2, count / maxCount) : 1;
                        return <div key={j} className={`w-3 h-3 rounded-sm ${colorClass}`} style={{ opacity }} title={`${dateString}: ${count} event(s)`} />;
                    })}
                </div>
            ))}
        </div>
    );
};

function SubjectPerformance({ exams, results }: { exams: Exam[], results: any[] }) {
    const performanceBySubject = useMemo(() => {
        const subjects: { [key: string]: { scores: number[], count: number } } = {};
        results.forEach(result => {
            const exam = exams.find(e => e.id === result.examId);
            if (exam && exam.subject) {
                if (!subjects[exam.subject]) {
                    subjects[exam.subject] = { scores: [], count: 0 };
                }
                subjects[exam.subject].scores.push(result.score);
                subjects[exam.subject].count++;
            }
        });

        return Object.entries(subjects).map(([subject, data]) => ({
            subject,
            average: data.scores.reduce((a, b) => a + b, 0) / data.count,
            count: data.count,
        })).sort((a,b) => b.average - a.average);
    }, [exams, results]);

    if(performanceBySubject.length === 0) return <p className="text-slate-500 dark:text-slate-400">No categorized exams yet.</p>;

    return (
        <div className="space-y-3">
            {performanceBySubject.map(({subject, average, count}) => (
                <div key={subject}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">{subject}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{Math.round(average)}% avg. ({count} exams)</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${average >= 50 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${average}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

function AIMotivationalInsight({ exams, results }: { exams: Exam[], results: any[] }) {
    const [insight, setInsight] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsight = async () => {
            if (results.length < 2) {
                setInsight("Keep taking exams to unlock personalized motivational insights!");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            
            try {
                const today = new Date().toISOString().split('T')[0];
                const cachedData = localStorage.getItem('aiMotivationalInsight');
                if (cachedData) {
                    const { date, insight: cachedInsight } = JSON.parse(cachedData);
                    if (date === today) {
                        setInsight(cachedInsight);
                        setIsLoading(false);
                        return;
                    }
                }

                const data = results.map(r => {
                    const exam = exams.find(e => e.id === r.examId);
                    return { subject: exam?.subject || 'General', score: r.score, date: r.submittedAt };
                });
                const dataString = JSON.stringify(data.slice(-10)); // last 10 results
                
                const result = await getMotivationalInsight(dataString);
                setInsight(result);
                localStorage.setItem('aiMotivationalInsight', JSON.stringify({ date: today, insight: result }));
            } catch (e) {
                setInsight("Great job on your recent work. Stay focused and keep pushing forward!");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInsight();
    }, [exams, results]);

    return (
        // Fix: Added children to Card component to resolve missing prop error.
        <Card className="bg-primary-50 dark:bg-slate-800 border border-primary-200 dark:border-slate-700">
             <h3 className="font-bold text-lg text-primary-800 dark:text-primary-200 mb-2">AI Motivational Coach</h3>
            {isLoading ? <Loader text="Analyzing..." /> : <p className="text-slate-700 dark:text-slate-300">{insight}</p>}
        </Card>
    );
};


function AnalyticsScreen() {
    const { exams, results, dispatch } = useExam();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const uncategorizedExams = exams.filter(e => !e.subject);
        if (uncategorizedExams.length > 0) {
            const categorize = async () => {
                try {
                    const categories = await categorizeSubjects(uncategorizedExams);
                    categories.forEach(({ examId, subject }) => {
                        const examToUpdate = exams.find(e => e.id === examId);
                        if (examToUpdate) {
                            // FIX: Using ExamActionType for correct type.
                            dispatch({ type: ExamActionType.UPDATE_EXAM, payload: { ...examToUpdate, subject } });
                        }
                    });
                } catch (error) {
                    console.error("Failed to categorize subjects:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            categorize();
        } else {
            setIsLoading(false);
        }
    }, [exams, dispatch]);

    const studyEvents = useMemo(() => {
        const events: { [date: string]: number } = {};
        results.forEach(r => {
            const date = r.submittedAt.split('T')[0];
            events[date] = (events[date] || 0) + 1;
        });
        // You could add other events here, e.g., created study aids
        return events;
    }, [results]);

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold">Your Study Analytics</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Discover your learning patterns and stay motivated.</p>
            </div>

            {isLoading ? <Loader text="Analyzing your progress..." /> : (
                <>
                    <AIMotivationalInsight exams={exams} results={results} />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Fix: Added children to Card component to resolve missing prop error. */}
                        <Card className="lg:col-span-2">
                            <h2 className="text-xl font-bold mb-4">Study Heatmap</h2>
                            <Heatmap data={studyEvents} />
                        </Card>
                        {/* Fix: Added children to Card component to resolve missing prop error. */}
                        <Card>
                            <h2 className="text-xl font-bold mb-4">Subject Performance</h2>
                            <SubjectPerformance exams={exams} results={results} />
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnalyticsScreen;