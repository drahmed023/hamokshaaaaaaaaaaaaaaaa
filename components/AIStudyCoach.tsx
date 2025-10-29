





import React, { useState, useEffect } from 'react';
import Card from './Card';
import Loader from './Loader';
import { useExam } from '../hooks/useExam';
import { useStudyAids } from '../hooks/useStudyAids';
import { useStudyPlan } from '../hooks/useStudyPlan';
import { getDailyStudySuggestion } from '../services/geminiService';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

function AIStudyCoach() {
    const [suggestion, setSuggestion] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const { results } = useExam();
    const { flashcardDecks } = useStudyAids();
    const { plan } = useStudyPlan();
    // Assuming tasks are in localStorage from TasksScreen
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]').filter((t: any) => !t.completed);

    useEffect(() => {
        const fetchSuggestion = async () => {
            setIsLoading(true);
            try {
                // Construct a context string for the AI
                let context = "Here is the student's current status:\n";
                
                if (results.length > 0) {
                    const lastResult = results[results.length - 1];
                    context += `- Last exam score was ${Math.round(lastResult.score)}%.\n`;
                } else {
                    context += "- The user has not taken any exams yet.\n";
                }
                
                const dueCards = flashcardDecks.flatMap(d => d.cards.filter(c => new Date(c.nextReview) <= new Date())).length;
                if (dueCards > 0) {
                    context += `- There are ${dueCards} flashcards due for review.\n`;
                }

                if (plan) {
                    context += `- Current weekly goal: ${plan.weeks[0]?.weeklyGoal}\n`;
                }

                if (tasks.length > 0) {
                    context += `- Pending tasks: ${tasks.map((t: any) => t.text).join(', ')}\n`;
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
    }, []); // Run once on component mount

    return (
        // Fix: Added children to Card component to resolve missing prop error.
        <Card className="w-full max-w-4xl bg-primary-50 dark:bg-slate-800 border border-primary-200 dark:border-slate-700">
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