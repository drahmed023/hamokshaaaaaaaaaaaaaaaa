
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookmarks } from '../hooks/useBookmarks';
import { useExam } from '../hooks/useExam';
import Card from '../components/Card';
import Button from '../components/Button';
import { BookmarksActionType } from '../types';
import { BookmarkIcon } from '../components/icons/BookmarkIcon';
import { TrashIcon } from '../components/icons/TrashIcon';

function BookmarkedQuestionsScreen() {
  const { bookmarks, dispatch } = useBookmarks();
  const { exams } = useExam();
  const navigate = useNavigate();

  // SAFETY FILTER: Ensure question actually exists in the current exam set
  const bookmarkedItems = bookmarks.map(bookmark => {
    const exam = exams.find(e => e.id === bookmark.examId);
    if (!exam) return null;
    const question = exam.questions.find(q => q.id === bookmark.questionId);
    if (!question) return null;
    return { exam, question };
  }).filter((item): item is { exam: any, question: any } => item !== null);

  const handleRemoveBookmark = (questionId: string) => {
    dispatch({ type: BookmarksActionType.REMOVE_BOOKMARK, payload: { questionId } });
  };

  if (bookmarkedItems.length === 0) {
    return (
      <div className="text-center py-20" dir="ltr">
        <BookmarkIcon className="w-16 h-16 mx-auto text-slate-400" />
        <h1 className="text-3xl font-black mt-4 uppercase tracking-tight">No Bookmarks</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold uppercase tracking-widest text-[10px]">Your academic favorites vault is currently empty.</p>
        <Button onClick={() => navigate('/')} className="mt-8 px-8 h-12 rounded-xl shadow-lg">Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4" dir="ltr">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tight">Academic Vault</h1>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Saved Questions & Verified Solutions</p>
      </div>
      
      <div className="space-y-6">
        {bookmarkedItems.map(({ exam, question }) => (
          <div key={question.id} className="animate-fade-in">
            <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-grow pr-4">
                  <span className="inline-block px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 rounded text-[9px] font-black uppercase tracking-widest mb-3">From: {exam.title}</span>
                  <p className="text-lg font-black text-slate-900 dark:text-white leading-relaxed">{question.questionText}</p>
                </div>
                <Button onClick={() => handleRemoveBookmark(question.id)} variant="secondary" size="sm" className="!p-2 rounded-xl border-slate-200" aria-label="Remove bookmark">
                  <TrashIcon className="w-4.5 h-4.5 text-rose-500" />
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {question.options.map((option: string, i: number) => {
                  const isCorrect = option === question.correctAnswer;
                  const letters = ['A', 'B', 'C', 'D', 'E'];
                  return (
                    <div key={i} className={`p-4 border-2 rounded-2xl flex items-center gap-4 transition-all ${isCorrect ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/30 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/40 border-transparent opacity-60'}`}>
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                        {letters[i]}
                      </span>
                      <span className={`text-sm font-bold ${isCorrect ? 'text-emerald-900 dark:text-emerald-100' : 'text-slate-600 dark:text-slate-400'}`}>{option}</span>
                      {isCorrect && <CheckCircleIcon className="w-4 h-4 text-emerald-500 ml-auto" />}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}

export default BookmarkedQuestionsScreen;
