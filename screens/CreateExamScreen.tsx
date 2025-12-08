import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
// FIX: Updated to use renamed ExamActionType to avoid type conflicts.
import { ExamActionType, Exam } from '../types';
import { generateExamFromText } from '../services/geminiService';
import { parseFileToText } from '../utils/fileParser';
import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { FileTextIcon } from '../components/icons/FileTextIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { useSmartSettings } from '../hooks/useSmartSettings';

function CreateExamScreen() {
  const [text, setText] = useState('');
  const [numQuestions, setNumQuestions] = useState(10);
  const [numCaseQuestions, setNumCaseQuestions] = useState(2);
  const [fileName, setFileName] = useState('');
  const { exams, loading, error, dispatch } = useExam();
  const { adaptiveLearning } = useSmartSettings();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.content) {
      setText(location.state.content);
      setFileName(location.state.fileName || '');
      // Clear the state to prevent re-populating on refresh
      navigate('.', { replace: true, state: {} });
    }
  }, [location, navigate]);
  
  // Ensure case questions don't exceed total questions
  useEffect(() => {
    if (numCaseQuestions > numQuestions) {
      setNumCaseQuestions(numQuestions);
    }
  }, [numQuestions, numCaseQuestions]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // FIX: Using ExamActionType for correct type.
      dispatch({ type: ExamActionType.SET_LOADING, payload: true });
      // FIX: Using ExamActionType for correct type.
      dispatch({ type: ExamActionType.SET_ERROR, payload: null });
      try {
        const content = await parseFileToText(file);
        setText(content);
      } catch (err: any) {
        // FIX: Using ExamActionType for correct type.
        dispatch({ type: ExamActionType.SET_ERROR, payload: err.message });
      } finally {
        // FIX: Using ExamActionType for correct type.
        dispatch({ type: ExamActionType.SET_LOADING, payload: false });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      // FIX: Using ExamActionType for correct type.
      dispatch({ type: ExamActionType.SET_ERROR, payload: 'Please enter text or upload a file.' });
      return;
    }
    // FIX: Using ExamActionType for correct type.
    dispatch({ type: ExamActionType.SET_LOADING, payload: true });
    // FIX: Using ExamActionType for correct type.
    dispatch({ type: ExamActionType.SET_ERROR, payload: null });
    try {
      // Find existing questions from the same file to avoid duplicates
      const existingExamsFromFile = exams.filter(exam => exam.sourceFileName && exam.sourceFileName === fileName);
      const existingQuestions = existingExamsFromFile.flatMap(exam => exam.questions.map(q => q.questionText));

      const examData = await generateExamFromText(text, numQuestions, numCaseQuestions, adaptiveLearning, existingQuestions);
      const newExam: Exam = {
        ...examData,
        id: Date.now().toString(),
        questions: examData.questions.map((q, index) => ({...q, id: `${Date.now()}-${index}`})),
        sourceFileName: fileName,
      };
      // FIX: Using ExamActionType for correct type.
      dispatch({ type: ExamActionType.ADD_EXAM, payload: newExam });
      navigate(`/exam/${newExam.id}`);
    } catch (err: any)      {
      // FIX: Using ExamActionType for correct type.
      dispatch({ type: ExamActionType.SET_ERROR, payload: err.message });
    } finally {
      // FIX: Using ExamActionType for correct type.
      dispatch({ type: ExamActionType.SET_LOADING, payload: false });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Create a New Exam</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Enter text or upload a file to generate your exam with AI.</p>
      </div>

      {/* Fix: Added children to Card component to resolve missing prop error. */}
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="text-input" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Study Content
            </label>
            <textarea
              id="text-input"
              rows={10}
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400"
              placeholder="Paste your content here or select a file..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="text-center text-sm text-slate-500 dark:text-slate-400">OR</div>

          <div>
            <label htmlFor="file-upload" className="flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50">
              <FileTextIcon className="w-5 h-5 text-slate-500" />
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {fileName ? `Selected: ${fileName}` : 'Choose a file (.pdf, .docx, .txt)'}
              </span>
              <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.pdf,.docx,.doc,.ppt,.pptx" disabled={loading} />
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="num-questions" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Total Questions
                </label>
                <input
                type="number"
                id="num-questions"
                min="1"
                max="100"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.max(1, parseInt(e.target.value, 10)))}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600"
                disabled={loading}
                />
            </div>
            <div>
                <label htmlFor="num-case-questions" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Case/Scenario Questions
                </label>
                <input
                type="number"
                id="num-case-questions"
                min="0"
                max={numQuestions}
                value={numCaseQuestions}
                onChange={(e) => setNumCaseQuestions(Math.min(numQuestions, Math.max(0, parseInt(e.target.value, 10))))}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600"
                disabled={loading}
                />
            </div>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-sm text-center">
            <p>You will get <span className="font-bold">{numCaseQuestions} case questions</span> and <span className="font-bold">{numQuestions - numCaseQuestions} general questions</span>.</p>
          </div>


          {error && <div className="text-red-500 text-sm p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>}

          <div className="pt-2">
            {/* Fix: Added children to Button component to resolve missing prop error. */}
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