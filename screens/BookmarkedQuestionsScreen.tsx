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

  const bookmarkedItems = bookmarks.map(bookmark => {
    const exam = exams.find(e => e.id === bookmark.examId);
    if (!exam) return null;
    const question = exam.questions.find(q => q.id === bookmark.questionId);
    if (!question) return null;
    return { exam, question };
  }).filter(Boolean as any);

  const handleRemoveBookmark = (questionId: string) => {
    dispatch({ type: BookmarksActionType.REMOVE_BOOKMARK, payload: { questionId } });
  };

  if (bookmarkedItems.length === 0) {
    return (
      <div className="text-center">
        <BookmarkIcon className="w-16 h-16 mx-auto text-slate-400" />
        <h1 className="text-3xl font-bold mt-4">No Bookmarked Questions</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">You can bookmark questions during an exam to review them later.</p>
        <Button onClick={() => navigate('/')} className="mt-6">Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Bookmarked Questions</h1>
      <div className="space-y-6">
        {bookmarkedItems.map(({ exam, question }) => (
          // FIX: Wrapped the Card component in a div and moved the key prop to the div to resolve a TypeScript prop error. The 'key' prop is for React's reconciliation and should not be passed to custom components directly if their props type doesn't explicitly define it.
          <div key={question.id}>
            <Card>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-semibold">{question.questionText}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">From: {exam.title}</p>
                </div>
                <Button onClick={() => handleRemoveBookmark(question.id)} variant="secondary" size="sm" className="!p-2" aria-label="Remove bookmark">
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {question.options.map(option => (
                  <div key={option} className={`p-3 border rounded-lg ${option === question.correctAnswer ? 'bg-green-100 dark:bg-green-900/40 border-green-500 font-semibold' : 'bg-slate-50 dark:bg-slate-700/50 border-slate-300 dark:border-slate-600'}`}>
                    {option}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BookmarkedQuestionsScreen;
