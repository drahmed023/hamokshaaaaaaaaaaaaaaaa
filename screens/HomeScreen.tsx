import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { useExam } from '../hooks/useExam';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import StackedBarChart from '../components/StackedBarChart';
import { ChartBarSquareIcon } from '../components/icons/ChartBarSquareIcon';
import { FireIcon } from '../components/icons/FireIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import ScoreRing from '../components/ScoreRing';
import { PlusIcon } from '../components/icons/PlusIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
// FIX: Add missing import for Button component.
import Button from '../components/Button';
import AIStudyCoach from '../components/AIStudyCoach';

function HomeScreen() {
  const navigate = useNavigate();
  const { exams, results } = useExam();
  const [performancePeriod, setPerformancePeriod] = useState<'week' | 'month'>('week');

  const performanceData = useMemo(() => {
    const days = performancePeriod === 'week' ? 7 : 30;
    const data = Array(days).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        return { day, correct: 0, total: 0, date: date.toISOString().split('T')[0] };
    });

    const relevantResults = results.filter(r => {
        const resultDate = new Date(r.submittedAt);
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        return resultDate >= startDate;
    });

    relevantResults.forEach(result => {
        const resultDateStr = result.submittedAt.split('T')[0];
        const dayData = data.find(d => d.date === resultDateStr);
        if (dayData) {
            const exam = exams.find(e => e.id === result.examId);
            if (exam) {
                const correctCount = Math.round(result.score / 100 * exam.questions.length);
                dayData.correct += correctCount;
                dayData.total += exam.questions.length;
            }
        }
    });

    return data;
  }, [results, exams, performancePeriod]);

  const todayStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let questionsSolved = 0;
    let correctAnswers = 0;

    results.forEach(result => {
      if (result.submittedAt.startsWith(todayStr)) {
        const exam = exams.find(e => e.id === result.examId);
        if (exam) {
          questionsSolved += exam.questions.length;
          correctAnswers += Math.round((result.score / 100) * exam.questions.length);
        }
      }
    });

    const percentage = questionsSolved > 0 ? Math.round((correctAnswers / questionsSolved) * 100) : 0;
    return { questionsSolved, percentage };
  }, [results, exams]);

  const activityData = useMemo(() => {
    const activityMap = new Map<string, number>();
    results.forEach(r => {
        const date = r.submittedAt.split('T')[0];
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });

    const today = new Date();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const dateToCheck = new Date(today);

    // Calculate longest streak
    const sortedDates = Array.from(activityMap.keys()).sort();
    if (sortedDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const prevDate = new Date(sortedDates[i - 1]);
        const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }
    }
    
    // Calculate current streak
    if (activityMap.has(today.toISOString().split('T')[0])) {
      currentStreak = 1;
      dateToCheck.setDate(today.getDate() - 1);
      while(activityMap.has(dateToCheck.toISOString().split('T')[0])) {
        currentStreak++;
        dateToCheck.setDate(dateToCheck.getDate() - 1);
      }
    }

    return { activityMap, currentStreak, longestStreak };
  }, [results]);

  const recentActivity = useMemo(() => {
    return results
      .map(result => {
        const exam = exams.find(e => e.id === result.examId);
        return { ...result, exam };
      })
      .filter(item => item.exam)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 3);
  }, [results, exams]);


  const ActivityHeatmap = () => {
    const today = new Date();
    const months: string[] = [];
    const weeks: Date[][] = [];

    // Go back 3 months (approx 12 weeks)
    const startDate = new Date();
    startDate.setMonth(today.getMonth() - 2);
    startDate.setDate(1);
    
    let currentMonth = -1;
    for (let i = 0; i < 12; i++) {
        const week: Date[] = [];
        for (let j = 0; j < 7; j++) {
            const day = new Date(startDate);
            day.setDate(startDate.getDate() + (i * 7) + j);
            week.push(day);
            if (day.getMonth() !== currentMonth) {
                currentMonth = day.getMonth();
                months.push(day.toLocaleString('default', { month: 'short' }));
            }
        }
        weeks.push(week);
    }
    
    const getColorClass = (count: number) => {
        if (count === 0) return 'bg-slate-200 dark:bg-slate-700/50';
        if (count <= 2) return 'bg-primary-200 dark:bg-primary-900';
        if (count <= 5) return 'bg-primary-400 dark:bg-primary-700';
        return 'bg-primary-600 dark:bg-primary-500';
    };

    return (
        <div>
            <div className="flex justify-around text-xs text-slate-500 dark:text-slate-400 mb-1">
                {months.map((month, i) => <span key={i}>{month}</span>)}
            </div>
            <div className="flex justify-start gap-1">
                {weeks.map((week, i) => (
                    <div key={i} className="grid grid-rows-7 gap-1">
                        {week.map((day, j) => {
                            const dateString = day.toISOString().split('T')[0];
                            const count = activityData.activityMap.get(dateString) || 0;
                            return <div key={j} className={`w-3 h-3 rounded-sm ${getColorClass(count)}`} title={`${dateString}: ${count} quizzes`} />;
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Welcome Banner */}
        <div className="relative p-8 rounded-2xl text-white bg-primary-700 dark:bg-primary-800 overflow-hidden">
            <div className="relative z-10">
                <h1 className="text-3xl font-bold">Welcome back!</h1>
                <p className="mt-2 text-primary-200 max-w-sm">Ready to learn today?</p>
                <Button onClick={() => navigate('/create-exam')} className="mt-6 !bg-white/20 !text-white hover:!bg-white/30 backdrop-blur-sm">
                    <SparklesIcon className="w-5 h-5 mr-2"/>
                    Create Quiz
                </Button>
            </div>
            <div className="absolute -right-16 -bottom-10 opacity-20">
              <svg width="250" height="200" viewBox="0 0 250 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="70" y="130" width="180" height="70" rx="10" fill="white"/>
                <rect x="80" y="140" width="160" height="8" rx="4" fill="#A78BFA"/>
                <rect x="80" y="155" width="120" height="8" rx="4" fill="#A78BFA"/>
                <rect x="80" y="170" width="160" height="8" rx="4" fill="#A78BFA"/>
                <path d="M78.6539 33.5031C75.2891 16.5388 92.5939 5.82329 105.812 11.4554L173.743 40.063C186.961 45.6951 185.228 64.249 171.399 67.5843L92.793 85.922C78.9646 89.2573 68.043 75.2536 78.6539 65.5721L78.6539 33.5031Z" fill="white"/>
                <circle cx="125" cy="75" r="50" fill="white"/>
                <path d="M125 45C116.716 45 110 51.7157 110 60V65C110 73.2843 116.716 80 125 80C133.284 80 140 73.2843 140 65V60C140 51.7157 133.284 45 125 45Z" fill="#E0E7FF"/>
                <circle cx="125" cy="58" r="10" fill="white"/>
              </svg>
            </div>
        </div>

        <AIStudyCoach />

        {/* Performance Overview */}
        <Card className="!p-0">
          <div className="p-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2"><ChartBarSquareIcon className="w-6 h-6 text-slate-500"/> Performance Overview</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Track how many questions you've solved.</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-md">
                    <Button onClick={() => setPerformancePeriod('week')} size="sm" variant={performancePeriod === 'week' ? 'primary' : 'secondary'} className="!px-2 !py-1">Last Week</Button>
                    <Button onClick={() => setPerformancePeriod('month')} size="sm" variant={performancePeriod === 'month' ? 'primary' : 'secondary'} className="!px-2 !py-1">Last Month</Button>
                </div>
            </div>
            
            <div className="mt-6 flex justify-between items-center">
                <div>
                    <p className="font-semibold">You have solved {todayStats.questionsSolved} questions today</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{todayStats.percentage}% Correct answers</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"/> Correct</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary-800 dark:bg-primary-900"/> Incorrect</div>
                </div>
            </div>
          </div>
          <div className="px-6 pb-6">
            <StackedBarChart data={performanceData} />
          </div>
        </Card>
      </div>

      {/* Right Sidebar */}
      <div className="space-y-6">
        <Card className="bg-slate-800 dark:bg-slate-900 text-white">
            <h2 className="font-bold text-lg">Unlock Premium Features</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-1 mt-2 text-sm">
                <li>Get access to exclusive benefits.</li>
                <li>Unlimited daily Quizzes.</li>
                <li>Premium QS banks.</li>
            </ul>
            <Button className="w-full mt-4 !bg-primary-600 hover:!bg-primary-700">Upgrade</Button>
        </Card>

        <Card>
            <h2 className="text-lg font-bold flex items-center gap-2"><FireIcon className="w-5 h-5 text-orange-500"/> Activity Streak</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-4">Your activity in the last 3 months.</p>
            <ActivityHeatmap />
            <div className="flex justify-between mt-4 text-sm">
                <div>Current streak: <span className="font-bold">{activityData.currentStreak} days</span></div>
                <div>Longest streak: <span className="font-bold">{activityData.longestStreak} days</span></div>
            </div>
        </Card>

        <Card>
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-slate-500"/> Upcoming Exams</h2>
                <button className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600">
                    <PlusIcon className="w-4 h-4"/>
                </button>
            </div>
            <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto"/>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Click the + to add exam dates.</p>
            </div>
        </Card>

        <Card>
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><ClockIcon className="w-5 h-5 text-slate-500"/> Recent Activity</h2>
                <button onClick={() => navigate('/history')} className="text-sm font-semibold text-primary-600 dark:text-primary-400">See All</button>
            </div>
            {recentActivity.length > 0 ? (
                <ul className="space-y-4">
                    {recentActivity.map(item => (
                        <li key={item.examId} className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-primary-600 dark:text-primary-400 text-lg">
                                #
                            </div>
                            <div className="flex-grow">
                                <p className="font-semibold">{item.exam!.title}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{item.exam!.subject || 'General'}</p>
                            </div>
                            <ScoreRing score={item.score} />
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-center py-4 text-slate-500 dark:text-slate-400">No recent activity.</p>
            )}
        </Card>
      </div>
    </div>
  );
};

export default HomeScreen;