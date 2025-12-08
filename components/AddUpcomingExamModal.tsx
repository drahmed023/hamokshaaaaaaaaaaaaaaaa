import React, { useState } from 'react';
import Button from './Button';
import { useUpcomingExams } from '../hooks/useUpcomingExams';
import { UpcomingExamsActionType } from '../types';
import { XCircleIcon } from './icons/XCircleIcon';
import { CalendarIcon } from './icons/CalendarIcon';

interface AddUpcomingExamModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AddUpcomingExamModal({ isOpen, onClose }: AddUpcomingExamModalProps) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const { dispatch } = useUpcomingExams();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && date) {
      dispatch({
        type: UpcomingExamsActionType.ADD_UPCOMING_EXAM,
        payload: {
          id: Date.now().toString(),
          title,
          date,
        },
      });
      setTitle('');
      setDate('');
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 p-6 rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <CalendarIcon className="w-5 h-5 text-primary-500" />
            Add Upcoming Exam
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="exam-title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Title</label>
            <input
              id="exam-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Biology Midterm"
              className="w-full p-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600"
              required
            />
          </div>
          <div>
            <label htmlFor="exam-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
            <input
              id="exam-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white dark:bg-slate-800 dark:border-slate-600"
              required
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button onClick={onClose} variant="secondary">Cancel</Button>
            <Button type="submit">Add Exam</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddUpcomingExamModal;
