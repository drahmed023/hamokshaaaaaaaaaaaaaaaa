
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import Button from '../components/Button';
import { GamificationActionType, Question } from '../types';
import { useGamification } from '../hooks/useGamification';
import { useBookmarks } from '../hooks/useBookmarks';
import { getExplanationForAnswer } from '../services/geminiService';
import Loader from '../components/Loader';

// Icons
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { MenuIcon } from '../components/icons/MenuIcon';
import { ShareIcon } from '../components/icons/ShareIcon';
import { CheckIcon } from '../components/icons/CheckIcon';
import { XIcon } from '../components/icons/XIcon';
import { BookmarkIcon } from '../components/icons/BookmarkIcon';
import { ThumbUpIcon } from '../components/icons/ThumbUpIcon';
import { ThumbDownIcon } from '../components/icons/ThumbDownIcon';
import { DotsVerticalIcon } from '../components/icons/DotsVerticalIcon';
import { FlaskIcon } from '../components/icons/FlaskIcon';
import { GridIcon } from '../components/icons/GridIcon';
import { SettingsIcon } from '../components/icons/SettingsIcon';
import { ExpandIcon } from '../components/icons/ExpandIcon';
import { ClockIcon } from '../components/icons/ClockIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { XCircleIcon } from '../components/icons/XCircleIcon';

function Explanation({ question, userAnswer }: { question: Question; userAnswer: string | undefined }) {
    const [explanation, setExplanation] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchExplanation = async () => {
        if (!userAnswer || !question) return;
        setIsLoading(true);
        try {
            const result = await getExplanationForAnswer(question.questionText, userAnswer, question.correctAnswer);
            setExplanation(result);
        } catch (error) {
            setExplanation("Could not fetch explanation.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="p-2"><Loader text="Getting AI explanation..." /></div>;
    }

    if (explanation) {
        return <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg text-sm">{explanation}</div>;
    }

    return (
        <div className="mt-4">
          <Button onClick={fetchExplanation} size="sm" variant="secondary">
              Show Explanation
          </Button>
        </div>
    );
};


function ResultsScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exams, results } = useExam();
  const { bookmarks } = useBookmarks();
  const { dispatch: gamificationDispatch } = useGamification();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const exam = exams.find(e => e.id === id);
  const result = results.find(r => r.examId === id);

  useEffect(() => {
    if (result) {
        const lastAwarded = sessionStorage.getItem(`xp_awarded_${result.examId}`);
        if(lastAwarded !== result.submittedAt) {
            const xpGained = Math.round(result.score);
            gamificationDispatch({ type: GamificationActionType.ADD_XP, payload: xpGained });
            if (results.length === 1) gamificationDispatch({ type: GamificationActionType.UNLOCK_ACHIEVEMENT, payload: 'exam_1' });
            if (results.length >= 5) gamificationDispatch({ type: GamificationActionType.UNLOCK_ACHIEVEMENT, payload: 'exam_5' });
            if (result.score === 100) gamificationDispatch({ type: GamificationActionType.UNLOCK_ACHIEVEMENT, payload: 'score_100' });
            sessionStorage.setItem(`xp_awarded_${result.examId}`, result.submittedAt);
        }
    }
  }, [result, results.length, gamificationDispatch]);

  const filteredQuestions = useMemo(() => {
    if (!exam) return [];
    if (!searchTerm) return exam.questions.map((q, i) => ({ ...q, originalIndex: i }));
    return exam.questions
        .map((q, i) => ({ ...q, originalIndex: i }))
        .filter(q => q.questionText.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [exam, searchTerm]);


  if (!exam || !result) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold">Result Not Found</h2>
        <Button onClick={() => navigate('/history')} className="mt-4">Back to History</Button>
      </div>
    );
  }

  const scorePercentage = Math.round(result.score);
  const correctAnswersCount = Math.round((scorePercentage / 100) * exam.questions.length);
  const currentQuestion = exam.questions[currentQuestionIndex];
  const userAnswer = result.answers.find(a => a.questionId === currentQuestion.id)?.answer;
  const isCurrentCorrect = userAnswer === currentQuestion.correctAnswer;

  const handleNext = () => currentQuestionIndex < exam.questions.length - 1 && setCurrentQuestionIndex(prev => prev + 1);
  const handlePrev = () => currentQuestionIndex > 0 && setCurrentQuestionIndex(prev => prev - 1);
  
  const Sidebar = () => (
     <aside className={`absolute md:relative z-20 w-80 h-full bg-slate-800 dark:bg-gray-900 text-white flex flex-col transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg truncate">{exam.title}</h2>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-white">
                <XCircleIcon className="w-6 h-6"/>
            </button>
          </div>
          <p className="text-sm text-slate-400">Tutor Mode</p>
           <div className="flex items-center gap-4 mt-2">
              <div className="w-full bg-slate-600 rounded-full h-2">
                  <div className="bg-primary-500 h-2 rounded-full" style={{ width: `${scorePercentage}%` }}></div>
              </div>
              <span className="text-sm font-semibold">{correctAnswersCount}/{exam.questions.length}</span>
          </div>
          <div className="relative mt-4">
              <input type="text" placeholder="Search Questions" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-700 rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
          </div>
        </div>

        <nav className="flex-grow overflow-y-auto p-2">
            <ul className="space-y-1">
                {filteredQuestions.map((q, index) => {
                    const questionResult = result.answers.find(a => a.questionId === q.id);
                    const isCorrect = questionResult?.answer === q.correctAnswer;
                    const isBookmarked = bookmarks.some(b => b.questionId === q.id);
                    const isSelected = q.originalIndex === currentQuestionIndex;

                    return (
                        <li key={q.id}>
                            <button onClick={() => setCurrentQuestionIndex(q.originalIndex)} className={`w-full text-left p-2 rounded-md flex items-start gap-3 transition-colors ${isSelected ? 'bg-primary-500/30' : 'hover:bg-slate-700'}`}>
                                <div className="flex-shrink-0 flex items-center gap-1">
                                    <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-400'}`}>{q.originalIndex + 1}</span>
                                    {isBookmarked && <BookmarkIcon solid className="w-3 h-3 text-yellow-400" />}
                                </div>
                                <span className={`flex-grow text-sm ${isSelected ? 'text-white font-semibold' : 'text-slate-300'}`}>{q.questionText}</span>
                                {isCorrect ? <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" /> : <XIcon className="w-4 h-4 text-red-500 flex-shrink-0" />}
                            </button>
                        </li>
                    )
                })}
            </ul>
        </nav>
        <div className="p-4 border-t border-slate-700 flex-shrink-0">
          <Button variant="secondary" className="w-full" onClick={() => navigate('/history')}>Back to History</Button>
        </div>
     </aside>
  );

  return (
    <div className="-mx-4 -my-8 h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900 flex flex-col">
       <header className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
           <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-500 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700">
                        <MenuIcon className="w-6 h-6"/>
                    </button>
                    <ShareIcon className="w-5 h-5 text-slate-500 hidden md:block" />
                    <span className="hidden md:block text-slate-400 mx-2">|</span>
                    <h1 className="font-bold text-lg">Question {currentQuestionIndex + 1} of {exam.questions.length}</h1>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                    <FlaskIcon className="w-6 h-6" />
                    <GridIcon className="w-6 h-6" />
                    <SettingsIcon className="w-6 h-6" />
                    <ExpandIcon className="w-6 h-6" />
                    <ClockIcon className="w-6 h-6" />
                    <span className="font-semibold text-sm">23:18</span>
                </div>
           </div>
       </header>

       <div className="flex flex-grow overflow-hidden relative">
           <Sidebar />

           <main className="flex-grow p-4 md:p-8 overflow-y-auto">
               <div className="max-w-3xl mx-auto">
                   <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                       <div className="flex justify-between items-start">
                           <div>
                               <p className="text-sm font-semibold text-slate-500">Question {currentQuestionIndex + 1} • GIT Bleeding</p>
                           </div>
                           <div className="flex items-center gap-2 text-slate-400">
                               <BookmarkIcon className="w-5 h-5 cursor-pointer hover:text-yellow-500" solid={bookmarks.some(b => b.questionId === currentQuestion.id)}/>
                               <ThumbUpIcon className="w-5 h-5 cursor-pointer hover:text-green-500" />
                               <ThumbDownIcon className="w-5 h-5 cursor-pointer hover:text-red-500" />
                               <DotsVerticalIcon className="w-5 h-5 cursor-pointer" />
                           </div>
                       </div>
                       <p className="mt-4 text-lg">{currentQuestion.questionText}</p>
                       <p className="text-xs text-slate-400 mt-2">QID: {currentQuestion.id.slice(0, 10)}</p>

                       <div className="mt-6 space-y-3">
                           {currentQuestion.options.map((option, index) => {
                               const isCorrectAnswer = option === currentQuestion.correctAnswer;
                               const isUserAnswer = option === userAnswer;
                               let optionClass = "bg-slate-100 dark:bg-slate-700/50 border-transparent";
                               if (isCorrectAnswer) {
                                   optionClass = "bg-green-100 dark:bg-green-900/30 border-green-500";
                               } else if (isUserAnswer) {
                                   optionClass = "bg-red-100 dark:bg-red-900/30 border-red-500";
                               }
                               const letters = ['A', 'B', 'C', 'D', 'E'];
                               return (
                                   <div key={index} className={`p-3 rounded-lg border flex items-center justify-between ${optionClass}`}>
                                       <div className="flex items-center">
                                           <span className="font-bold mr-3">{letters[index]}</span>
                                           <span>{option}</span>
                                       </div>
                                       {isCorrectAnswer && <CheckIcon className="w-5 h-5 text-green-600" />}
                                       <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{Math.round(Math.random()*15 + (isCorrectAnswer ? 70 : 0))}%</span>
                                   </div>
                               )
                           })}
                       </div>

                       {!isCurrentCorrect && <Explanation question={currentQuestion} userAnswer={userAnswer} />}

                       <div className="mt-8 flex justify-between">
                           <Button variant="secondary" onClick={handlePrev} disabled={currentQuestionIndex === 0}><ChevronLeftIcon className="w-5 h-5 mr-1"/> Previous</Button>
                           <Button onClick={handleNext} disabled={currentQuestionIndex === exam.questions.length - 1}>Next <ChevronRightIcon className="w-5 h-5 ml-1"/></Button>
                       </div>
                   </div>
               </div>
           </main>
       </div>
    </div>
  );
}

export default ResultsScreen;
