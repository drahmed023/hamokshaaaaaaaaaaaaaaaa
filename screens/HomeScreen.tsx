
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { useExam } from '../hooks/useExam';
import StackedBarChart from '../components/StackedBarChart';
import { ChartBarSquareIcon } from '../components/icons/ChartBarSquareIcon';
import { FireIcon } from '../components/icons/FireIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import ScoreRing from '../components/ScoreRing';
import { PlusIcon } from '../components/icons/PlusIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import Button from '../components/Button';
import AIStudyCoach from '../components/AIStudyCoach';
import AddUpcomingExamModal from '../components/AddUpcomingExamModal';
import { useUpcomingExams } from '../hooks/useUpcomingExams';
import { UpcomingExamsActionType } from '../types';
import { TrashIcon } from '../components/icons/TrashIcon';
// Fix: Added missing icon imports.
import { BotIcon } from '../components/icons/BotIcon';
import { CheckCircleIcon } from '../components/icons/CheckCircleIcon';

function HomeScreen() {
  const navigate = useNavigate();
  const { exams, results } = useExam();
  const { upcomingExams, dispatch: upcomingExamsDispatch } = useUpcomingExams();
  const [performancePeriod, setPerformancePeriod] = useState<'week' | 'month'>('week');
  const [isAddExamModalOpen, setIsAddExamModalOpen] = useState(false);

  const upcomingExamsToDisplay = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return upcomingExams
      .filter(exam => new Date(exam.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [upcomingExams]);

  const getDaysUntil = (dateString: string): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = dateString.split('-').map(Number);
    const examDate = new Date(year, month - 1, day);
    examDate.setHours(0,0,0,0);
    
    const diffTime = examDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `in ${diffDays} days`;
  };

  const handleDeleteUpcomingExam = (id: string) => {
    if (window.confirm('Are you sure you want to remove this exam date?')) {
      upcomingExamsDispatch({ type: UpcomingExamsActionType.DELETE_UPCOMING_EXAM, payload: id });
    }
  };

  const performanceData = useMemo(() => {
    const days = performancePeriod === 'week' ? 7 : 30;
    const data = Array(days).fill(0).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - 1 - i));
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        return { day, correct: 0, total: 0, date: date.toISOString().split('T')[0] };
    });

    results.forEach(result => {
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
    
    if (activityMap.has(today.toISOString().split('T')[0])) {
      currentStreak = 1;
      const dateToCheck = new Date(today);
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
        if (count === 0) return 'bg-slate-200/50 dark:bg-slate-700/50';
        if (count <= 2) return 'bg-primary-200/50 dark:bg-primary-900/50';
        if (count <= 5) return 'bg-primary-400/50 dark:bg-primary-700/50';
        return 'bg-primary-600/50 dark:bg-primary-500/50';
    };

    return (
        <div>
            <div className="flex justify-around text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-2">
                {months.map((month, i) => <span key={i}>{month}</span>)}
            </div>
            <div className="flex justify-start gap-1">
                {weeks.map((week, i) => (
                    <div key={i} className="grid grid-rows-7 gap-1">
                        {week.map((day, j) => {
                            const dateString = day.toISOString().split('T')[0];
                            const count = activityData.activityMap.get(dateString) || 0;
                            return <div key={j} className={`w-3 h-3 rounded-[2px] ${getColorClass(count)}`} title={`${dateString}: ${count} quizzes`} />;
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
  };


  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative p-10 rounded-[2.5rem] text-white bg-primary-600 dark:bg-primary-700 overflow-hidden shadow-2xl">
              <div className="relative z-10">
                  <h1 className="text-4xl font-black tracking-tight">Welcome back!</h1>
                  <p className="mt-2 text-primary-100 font-medium max-w-sm">Ready to learn today?</p>
                  <Button onClick={() => navigate('/create-exam')} className="mt-8 !bg-white/20 !text-white hover:!bg-white/30 backdrop-blur-md border border-white/30 rounded-2xl h-12 px-6">
                      <SparklesIcon className="w-5 h-5 mr-2"/>
                      Create Quiz
                  </Button>
              </div>
              <div className="absolute -right-12 -bottom-8 opacity-20 transform rotate-12 scale-110">
                <BotIcon className="w-64 h-64 text-white" />
              </div>
          </div>

          <AIStudyCoach />

          <Card className="rounded-[2.5rem]">
            <div className="p-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl">
                        <ChartBarSquareIcon className="w-7 h-7 text-primary-600 dark:text-primary-400"/>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Performance Overview</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Track how many questions you've solved.</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
                      <Button onClick={() => setPerformancePeriod('week')} size="sm" variant={performancePeriod === 'week' ? 'primary' : 'secondary'} className="!px-4 !py-2 rounded-lg text-xs font-black uppercase">Last Week</Button>
                      <Button onClick={() => setPerformancePeriod('month')} size="sm" variant={performancePeriod === 'month' ? 'primary' : 'secondary'} className="!px-4 !py-2 rounded-lg text-xs font-black uppercase">Last Month</Button>
                  </div>
              </div>
              
              <div className="mt-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
                  <div className="space-y-1">
                      <p className="font-black text-xl text-slate-900 dark:text-white">You solved {todayStats.questionsSolved} today</p>
                      <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{todayStats.percentage}% Correct answers</p>
                  </div>
                  <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em]">
                      <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/30"/> Correct
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
                        <div className="w-3 h-3 rounded-full bg-primary-800 dark:bg-primary-900 shadow-lg shadow-primary-900/30"/> Incorrect
                      </div>
                  </div>
              </div>
            </div>
            <div className="pt-8 px-2">
              <StackedBarChart data={performanceData} />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="!p-0 !bg-slate-900 dark:!bg-black rounded-3xl overflow-hidden border-none shadow-2xl">
              <div className="p-8">
                  <h2 className="font-black text-xl text-white">Unlock Premium</h2>
                  <p className="text-slate-400 mt-2 text-sm font-medium">Elevate your learning experience.</p>
                  <ul className="text-slate-300 space-y-2.5 mt-6 text-sm">
                      <li className="flex items-center gap-2 font-bold"><CheckCircleIcon className="w-4 h-4 text-primary-400" /> Unlimited daily Quizzes</li>
                      <li className="flex items-center gap-2 font-bold"><CheckCircleIcon className="w-4 h-4 text-primary-400" /> Premium Question Banks</li>
                      <li className="flex items-center gap-2 font-bold"><CheckCircleIcon className="w-4 h-4 text-primary-400" /> Advanced AI Analytics</li>
                  </ul>
                  <Button className="w-full mt-8 !bg-primary-600 hover:!bg-primary-500 rounded-2xl h-14 font-black uppercase tracking-widest shadow-xl shadow-primary-600/30">Upgrade Now</Button>
              </div>
          </Card>

          <Card className="rounded-3xl">
              <h2 className="text-lg font-black flex items-center gap-2.5 text-slate-900 dark:text-white uppercase tracking-tight"><FireIcon className="w-6 h-6 text-orange-500"/> Activity Streak</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1 mb-6">Last 3 months of progress.</p>
              <ActivityHeatmap />
              <div className="flex justify-between mt-6 pt-4 border-t border-slate-50 dark:border-slate-800 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
                  <div>Current streak: <span className="text-orange-600 ml-1">{activityData.currentStreak} days</span></div>
                  <div>Longest streak: <span className="text-primary-600 ml-1">{activityData.longestStreak} days</span></div>
              </div>
          </Card>

          <Card className="rounded-3xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black flex items-center gap-2.5 text-slate-900 dark:text-white uppercase tracking-tight"><CalendarIcon className="w-6 h-6 text-slate-400"/> Upcoming Exams</h2>
                <button onClick={() => setIsAddExamModalOpen(true)} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 hover:scale-110 transition-all shadow-sm">
                    <PlusIcon className="w-5 h-5"/>
                </button>
            </div>
            {upcomingExamsToDisplay.length > 0 ? (
                <ul className="space-y-5">
                    {upcomingExamsToDisplay.map(exam => (
                        <li key={exam.id} className="flex items-center gap-4 group">
                            <div className="flex-grow">
                                <p className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight">{exam.title}</p>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">{new Date(exam.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                            </div>
                            <div className="text-[10px] font-black text-primary-600 dark:text-primary-300 uppercase tracking-widest bg-primary-50 dark:bg-primary-900/30 px-3 py-1.5 rounded-lg border border-primary-100/50 dark:border-primary-800/30">{getDaysUntil(exam.date)}</div>
                            <button onClick={() => handleDeleteUpcomingExam(exam.id)} className="opacity-0 group-hover:opacity-100 transition-all p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg">
                                <TrashIcon className="w-4.5 h-4.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-10 bg-slate-50/50 dark:bg-slate-800/20 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <CalendarIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto opacity-50"/>
                    <div className="mt-6 space-y-2">
                        <p className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">No exams scheduled</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-6 leading-relaxed">Click the <span className="inline-flex items-center text-primary-600 px-1"><PlusIcon className="w-3.5 h-3.5"/></span> icon above to organize your upcoming test dates.</p>
                    </div>
                </div>
            )}
          </Card>

          <Card className="rounded-3xl">
               <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-black flex items-center gap-2.5 text-slate-900 dark:text-white uppercase tracking-tight"><ClockIcon className="w-6 h-6 text-slate-400"/> Recent Activity</h2>
                  <button onClick={() => navigate('/history')} className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 hover:opacity-70 transition-opacity">See All</button>
              </div>
              {recentActivity.length > 0 ? (
                  <ul className="space-y-5">
                      {recentActivity.map(item => (
                          <li key={item.examId} className="flex items-center gap-4 group">
                              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-primary-600 dark:text-primary-400 shadow-inner group-hover:scale-105 transition-transform">
                                  #
                              </div>
                              <div className="flex-grow overflow-hidden">
                                  <p className="font-black text-slate-900 dark:text-white truncate text-sm tracking-tight">{item.exam!.title}</p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest mt-1">{item.exam!.subject || 'General'}</p>
                              </div>
                              <ScoreRing score={item.score} size={44} strokeWidth={4} />
                          </li>
                      ))}
                  </ul>
              ) : (
                  <div className="py-8 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">History Empty</p>
                  </div>
              )}
          </Card>
        </div>
      </div>
      <AddUpcomingExamModal isOpen={isAddExamModalOpen} onClose={() => setIsAddExamModalOpen(false)} />
    </>
  );
};

export default HomeScreen;
