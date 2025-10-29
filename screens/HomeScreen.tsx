import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { useExam } from '../hooks/useExam';
import { BarChartIcon } from '../components/icons/BarChartIcon';
import BarChart from '../components/BarChart';
import AIStudyCoach from '../components/AIStudyCoach';
import { FilePlusIcon } from '../components/icons/FilePlusIcon';
import { GraduationCapIcon } from '../components/icons/GraduationCapIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import DashboardPomodoro from '../components/DashboardPomodoro';
import { AppLogoIcon } from '../components/icons/AppLogoIcon';

function HomeScreen() {
  const navigate = useNavigate();
  const { results } = useExam();

  const totalExams = results.length;
  const scores = results.map(r => r.score);
  const averageScore = totalExams > 0 ? Math.round(scores.reduce((acc, s) => acc + s, 0) / totalExams) : 0;
  const bestScore = totalExams > 0 ? Math.round(Math.max(...scores)) : 0;

  const recentExamsData = results
    .slice(-5)
    .map((r, i) => ({ label: `Exam ${i + 1}`, value: r.score }));

  const ActionCard = ({ icon, title, description, to, primary = false }: { icon: React.ReactNode, title: string, description: string, to: string, primary?: boolean }) => (
    <div
      className="group relative rounded-xl p-8 text-white overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer"
      onClick={() => navigate(to)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && navigate(to)}
    >
      <div className={`absolute inset-0 transition-all duration-500 ${primary ? 'bg-gradient-to-br from-primary-500 to-primary-700' : 'bg-gradient-to-br from-slate-700 to-slate-900'}`}></div>
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-4 bg-white/20 w-16 h-16 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
          {icon}
        </div>
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="mt-2 opacity-80 flex-grow">{description}</p>
        <div className="mt-6 flex items-center font-semibold">
          <span>Get Started</span>
          <ChevronRightIcon className="w-5 h-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center text-center space-y-12">
      <div className="space-y-4">
        <AppLogoIcon className="w-16 h-16 mx-auto text-primary-500" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-100">
          Supercharge Your Studies
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">
          Transform your study material into powerful learning tools with the help of AI.
        </p>
      </div>

      <DashboardPomodoro />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
        <ActionCard
          icon={<FilePlusIcon className="w-8 h-8 text-white" />}
          title="Create Exam"
          description="Turn your notes into a practice test in seconds."
          to="/create-exam"
          primary
        />
        <ActionCard
          icon={<GraduationCapIcon className="w-8 h-8 text-white" />}
          title="Study Aids"
          description="Generate flashcards, summaries, and mind maps automatically."
          to="/study-aids"
        />
      </div>

      <AIStudyCoach />

      {/* Fix: Added children to Card component to resolve missing prop error. */}
      <Card className="w-full max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Your Progress</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-1">A quick look at your recent study performance.</p>
            </div>
            {totalExams > 0 && (
                <div className="flex items-center gap-6 mt-4 md:mt-0">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{totalExams}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Exams</p>
                    </div>
                    <div className="text-center">
                        <p className={`text-3xl font-bold ${averageScore >= 50 ? 'text-green-600' : 'text-red-600'}`}>{averageScore}%</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Average</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">{bestScore}%</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Best</p>
                    </div>
                </div>
            )}
        </div>
        {totalExams > 0 ? (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-start mb-2">Recent Scores</h3>
            <BarChart data={recentExamsData} />
          </div>
        ) : (
          <div className="text-center py-12">
            <BarChartIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-4 text-slate-500 dark:text-slate-400">Take your first exam to see your stats here!</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default HomeScreen;