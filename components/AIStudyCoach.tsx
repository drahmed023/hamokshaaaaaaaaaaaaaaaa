
import React, { useState, useEffect } from 'react';
import Card from './Card';
import { useExam } from '../hooks/useExam';
import { useStudyAids } from '../hooks/useStudyAids';
import { useTasks } from '../hooks/useTasks';
import { getDailyStudySuggestion } from '../services/geminiService';
import { BotIcon } from './icons/BotIcon';
import { SparklesIcon } from './icons/SparklesIcon';

function AIStudyCoach() {
    const [suggestion, setSuggestion] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const { results } = useExam();
    const { flashcardDecks } = useStudyAids();
    const { tasks: allTasks } = useTasks();

    useEffect(() => {
        const fetchSuggestion = async () => {
            setIsLoading(true);
            try {
                const today = new Date().toISOString().split('T')[0];
                const cachedData = localStorage.getItem('aiStudyCoachSuggestion');
                if (cachedData) {
                    const { date, suggestion: cachedSuggestion } = JSON.parse(cachedData);
                    if (date === today) {
                        setSuggestion(cachedSuggestion);
                        setIsLoading(false);
                        return;
                    }
                }

                let context = "";
                if (results?.length > 0) {
                    const avg = results.reduce((a, b) => a + b.score, 0) / results.length;
                    context += `Avg Score: ${Math.round(avg)}%. `;
                }
                const pending = allTasks.filter(t => !t.completed).length;
                context += `${pending} pending tasks.`;

                const result = await getDailyStudySuggestion(context);
                setSuggestion(result);
                localStorage.setItem('aiStudyCoachSuggestion', JSON.stringify({ date: today, suggestion: result }));
            } catch (error) {
                setSuggestion("You are doing great! Keep up the deep study sessions today.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchSuggestion();
    }, [results, flashcardDecks, allTasks]);

    return (
        <div className="relative group overflow-hidden rounded-[2.5rem] p-[1.5px] bg-gradient-to-br from-primary-400 via-indigo-500 to-purple-600 shadow-2xl transition-all duration-500 hover:shadow-primary-500/20">
            <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl rounded-[calc(2.5rem-1.5px)] p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 bg-primary-600 dark:bg-primary-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary-600/40 group-hover:scale-105 group-hover:rotate-3 transition-all duration-500">
                        <BotIcon className="w-11 h-11 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-amber-400 rounded-full p-1.5 shadow-lg animate-bounce">
                        <SparklesIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full animate-pulse"></div>
                </div>
                
                <div className="flex-grow text-center md:text-left space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-primary-600 dark:text-primary-400 opacity-80">Dr. Zayn Academia</span>
                    </div>
                    {isLoading ? (
                        <div className="space-y-3 animate-pulse">
                            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-full mx-auto md:mx-0"></div>
                            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-2/3 mx-auto md:mx-0"></div>
                        </div>
                    ) : (
                        <p className="text-slate-900 dark:text-slate-100 text-xl font-black leading-tight tracking-tight">
                            "{suggestion}"
                        </p>
                    )}
                </div>
            </div>
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-primary-500/10 transition-colors"></div>
        </div>
    );
};

export default AIStudyCoach;
