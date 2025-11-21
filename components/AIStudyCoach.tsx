import React, { useState, useEffect } from 'react';
import Card from './Card';
import Loader from './Loader';
import { useExam } from '../hooks/useExam';
import { useStudyAids } from '../hooks/useStudyAids';
import { useStudyPlan } from '../hooks/useStudyPlan';
import { useTasks } from '../hooks/useTasks';
import { getDailyStudySuggestion } from '../services/geminiService';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

function AIStudyCoach() {
    const [suggestion, setSuggestion] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const { results } = useExam();
    const { flashcardDecks } = useStudyAids();
    const { plans, activePlanId } = useStudyPlan();
    const { tasks: allTasks } = useTasks();

    useEffect(() => {
        const fetchSuggestion = async () => {
            setIsLoading(true);
            try {
                const pendingTasks = allTasks.filter(t => !t.completed);
                const activePlan = plans.find(p => p.id === activePlanId);

                // Construct a context string for the AI
                let context = "Here is the student's current status:\n";
                
                if (results && results.length > 0) {
                    // Sort results to get the most recent one
                    const sortedResults = [...results].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
                    const lastResult = sortedResults[0];
                    context += `- Last exam score was ${Math.round(lastResult.score)}%.\n`;
                } else {
                    context += "- The user has not taken any exams yet.\n";
                }
                
                const dueCards = flashcardDecks.flatMap(d => d.cards.filter(c => new Date(c.nextReview) <= new Date())).length;
                if (dueCards > 0) {
                    context += `- There are ${dueCards} flashcards due for review.\n`;
                }

                if (activePlan && activePlan.weeks && activePlan.weeks.length > 0) {
                    context += `- Current weekly goal: ${activePlan.weeks[0]?.weeklyGoal}\n`;
                }

                if (pendingTasks.length > 0) {
                    context += `- Pending tasks: ${pendingTasks.map((t) => t.text).join(', ')}\n`;
                }

                const result = await getDailyStudySuggestion(context);
                setSuggestion(result);
            } catch (error) {
                console.error("Failed to get study suggestion:", error);
                setSuggestion("Could not load a suggestion. What's your top priority today?");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSuggestion();
    }, [results, flashcardDecks, plans, activePlanId, allTasks]);

    return (
        // Fix: Added children to Card component to resolve missing prop error.
        <Card className="w-full bg-primary-50 dark:bg-slate-800 border border-primary-200 dark:border-slate-700">
            <div className="flex items-start gap-4">
                <BrainCircuitIcon className="w-8 h-8 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
                <div>
                    <h2 className="text-xl font-bold text-start text-primary-800 dark:text-primary-200">Your AI Study Coach Says...</h2>
                    {isLoading ? (
                        <div className="py-4"><Loader text="Thinking..." /></div>
                    ) : (
                        <p className="mt-2 text-slate-700 dark:text-slate-300 text-start">{suggestion}</p>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default AIStudyCoach;