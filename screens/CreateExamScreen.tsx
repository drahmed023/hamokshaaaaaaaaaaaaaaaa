import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import { ActionType, Exam } from '../types';
import { generateExamFromText } from '../services/geminiService';
import { parseFileToText } from '../utils/fileParser';
import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { FileTextIcon } from '../components/icons/FileTextIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';

const CreateExamScreen: React.FC = () => {
  const [text, setText] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [fileName, setFileName] = useState('');
  const { loading, error, dispatch } = useExam();
  const navigate = useNavigate();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      dispatch({ type: ActionType.SET_LOADING, payload: true });
      dispatch({ type: ActionType.SET_ERROR, payload: null });
      try {
        const content = await parseFileToText(file);
        setText(content);
      } catch (err: any) {
        dispatch({ type: ActionType.SET_ERROR, payload: err.message });
      } finally {
        dispatch({ type: ActionType.SET_LOADING, payload: false });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      dispatch({ type: ActionType.SET_ERROR, payload: 'Please enter text or upload a file.' });
      return;
    }
    dispatch({ type: ActionType.SET_LOADING, payload: true });
    dispatch({ type: ActionType.SET_ERROR, payload: null });
    try {
      const examData = await generateExamFromText(text, numQuestions);
      const newExam: Exam = {
        ...examData,
        id: Date.now().toString(),
        questions: examData.questions.map((q, index) => ({...q, id: `${Date.now()}-${index}`})),
        sourceFileName: fileName,
      };
      dispatch({ type: ActionType.ADD_EXAM, payload: newExam });
      navigate(`/exam/${newExam.id}`);
    } catch (err: any)      {
      dispatch({ type: ActionType.SET_ERROR, payload: err.message });
    } finally {
      dispatch({ type: ActionType.SET_LOADING, payload: false });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Create a New Exam</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Enter text or upload a file to generate your exam with AI.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="text-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Study Content
            </label>
            <textarea
              id="text-input"
              rows={10}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400"
              placeholder="Paste your content here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="text-center text-sm text-slate-500 dark:text-slate-400">OR</div>

          <div>
            <label htmlFor="file-upload" className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <FileTextIcon className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-indigo-600 dark:text-indigo-400">
                {fileName ? `Selected: ${fileName}` : 'Choose a file (.txt)'}
              </span>
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt" disabled={loading} />
            </label>
          </div>

          <div>
            <label htmlFor="num-questions" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Number of Questions
            </label>
            <input
              type="number"
              id="num-questions"
              min="1"
              max="50"
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value, 10))}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600"
              disabled={loading}
            />
          </div>

          {error && <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>}

          <div className="pt-2">
            <Button type="submit" size="lg" disabled={loading || !text} className="w-full">
              {loading ? <Loader text="Generating Exam..."/> : (
                <div className="flex items-center justify-center gap-2">
                  <SparklesIcon className="w-5 h-5" />
                  <span>Generate Exam</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateExamScreen;