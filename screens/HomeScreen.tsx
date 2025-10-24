import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { useExam } from '../hooks/useExam';
import { BarChartIcon } from '../components/icons/BarChartIcon';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { results } = useExam();

  const totalExams = results.length;
  const averageScore = totalExams > 0 ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / totalExams) : 0;

  return (
    <div className="flex flex-col items-center text-center space-y-10">
      <div className="space-y-4">
        <SparklesIcon className="w-16 h-16 mx-auto text-indigo-500" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-100">
          Welcome to Study Spark AI
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-slate-600 dark:text-slate-300">
          Transform your study notes into interactive quizzes and powerful learning tools with AI.
        </p>
      </div>

       <Card className="w-full max-w-4xl">
            <div className="flex items-center gap-4">
                <BarChartIcon className="w-8 h-8 text-indigo-500" />
                <h2 className="text-2xl font-bold text-start">Performance Stats</h2>
            </div>
            <div className="grid grid-cols-2 gap-8 mt-4 text-center">
                <div>
                    <p className="text-4xl font-bold">{totalExams}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Exams Taken</p>
                </div>
                <div>
                    <p className={`text-4xl font-bold ${averageScore >= 50 ? 'text-green-600' : 'text-red-600'}`}>{averageScore}%</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Average Score</p>
                </div>
            </div>
        </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <Card className="text-start">
          <div className="flex flex-col h-full">
            <PlusCircleIcon className="w-10 h-10 mb-4 text-indigo-500" />
            <h2 className="text-2xl font-bold">Create a New Exam</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400 flex-grow">
              Upload a file or paste text to instantly generate a multiple-choice exam.
            </p>
            <div className="mt-6">
              <Button onClick={() => navigate('/create-exam')} size="lg">
                Get Started
              </Button>
            </div>
          </div>
        </Card>

        <Card className="text-start">
          <div className="flex flex-col h-full">
            <BookOpenIcon className="w-10 h-10 mb-4 text-indigo-500" />
            <h2 className="text-2xl font-bold">Explore Study Aids</h2>
            <p className="mt-2 text-slate-500 dark:text-slate-400 flex-grow">
              Boost your learning with AI-powered summaries, flashcards, and mind maps.
            </p>
            <div className="mt-6">
              <Button onClick={() => navigate('/study-aids')} variant="secondary" size="lg">
                Go to Aids
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HomeScreen;