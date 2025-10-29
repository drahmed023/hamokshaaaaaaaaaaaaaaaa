





import React from 'react';
import Card from '../components/Card';
import { useGamification } from '../hooks/useGamification';
import { achievementsList } from '../data/achievements';
import { TrophyIcon } from '../components/icons/TrophyIcon';

function AchievementsScreen() {
    const { unlockedAchievements } = useGamification();

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold">Achievements</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Track your accomplishments and study milestones.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievementsList.map(achievement => {
                    const isUnlocked = unlockedAchievements.includes(achievement.id);
                    const Icon = achievement.icon;
                    return (
                        <div key={achievement.id}>
                            {/* Fix: Added children to Card component to resolve missing prop error. */}
                            <Card className={`transition-all duration-300 ${isUnlocked ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isUnlocked ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <Icon className={`w-8 h-8 ${isUnlocked ? 'text-amber-500' : 'text-slate-400'}`} />
                                    </div>
                                    <h2 className={`font-bold text-lg ${isUnlocked ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}`}>{achievement.name}</h2>
                                    <p className={`text-sm mt-1 ${isUnlocked ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>{achievement.description}</p>
                                    {!isUnlocked && (
                                        <div className="mt-4 text-xs font-semibold text-slate-400 dark:text-slate-500">[LOCKED]</div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AchievementsScreen;