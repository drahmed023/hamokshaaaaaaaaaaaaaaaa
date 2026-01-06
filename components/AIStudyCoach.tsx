
import React, { useState, useEffect } from 'react';
import Card from './Card';
import Loader from './Loader';
import { useExam } from '../hooks/useExam';
import { useStudyAids } from '../hooks/useStudyAids';
import { useTasks } from '../hooks/useTasks';
import { getDailyStudySuggestion } from '../services/geminiService';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

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

                const pendingTasks = allTasks.filter(t => !t.completed);

                let context = "Status: ";
                
                if (results && results.length > 0) {
                    const sortedResults = [...results].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
                    const lastResult = sortedResults[0];
                    context += `Last score ${Math.round(lastResult.score)}%. `;
                } else {
                    context += "New user. ";
                }
                
                const dueCards = flashcardDecks.flatMap(d => d.cards.filter(c => new Date(c.nextReview) <= new Date())).length;
                if (dueCards > 0) {
                    context += `${dueCards} flashcards due. `;
                }

                if (pendingTasks.length > 0) {
                    context += `${pendingTasks.length} tasks pending. `;
                }

                const result = await getDailyStudySuggestion(context);
                setSuggestion(result);
                localStorage.setItem('aiStudyCoachSuggestion', JSON.stringify({ date: today, suggestion: result }));

            } catch (error) {
                console.error("Failed to get study suggestion:", error);
                setSuggestion("Keep going! You're making progress every day.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestion();
    }, [results, flashcardDecks, allTasks]);

    return (
        <Card className="w-full bg-primary-50/50 dark:bg-slate-800/50 border border-primary-100 dark:border-slate-700/50 rounded-[2rem] shadow-sm">
            <div className="flex items-center gap-5">
                <div className="p-3.5 bg-primary-600 dark:bg-primary-500 rounded-2xl shadow-lg shadow-primary-600/20 flex-shrink-0">
                    <BrainCircuitIcon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-grow">
                    <h2 className="text-sm font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">AI Study Coach</h2>
                    {isLoading ? (
                        <div className="py-2"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div></div>
                    ) : (
                        <p className="mt-1 text-slate-700 dark:text-slate-200 text-base font-bold leading-tight">{suggestion}</p>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default AIStudyCoach;
