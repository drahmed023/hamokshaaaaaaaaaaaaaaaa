
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import { ExamActionType, Exam } from '../types';
import { generateExamFromContent } from '../services/geminiService';
import { parseFileToText, blobToBase64 } from '../utils/fileParser';
import { extractFileIdFromUrl, getFileMetadata, getFileBlob, getFileContent } from '../services/googleDriveService';
import Button from '../components/Button';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { FileTextIcon } from '../components/icons/FileTextIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { useSmartSettings } from '../hooks/useSmartSettings';
import { useDropzone } from 'react-dropzone';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { LinkIcon } from '../components/icons/LinkIcon';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

function CreateExamScreen() {
  const [text, setText] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [numCaseQuestions, setNumCaseQuestions] = useState(2);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [fileName, setFileName] = useState('');
  const { exams, loading, error, dispatch } = useExam();
  const { adaptiveLearning } = useSmartSettings();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.content) {
      setText(location.state.content);
      setFileName(location.state.fileName || '');
      setUploadedFile(null);
      navigate('.', { replace: true, state: {} });
    }
  }, [location, navigate]);
  
  useEffect(() => {
    if (numCaseQuestions > numQuestions) {
      setNumCaseQuestions(numQuestions);
    }
  }, [numQuestions, numCaseQuestions]);

  const handleFile = async (file: File) => {
    if (file) {
      setFileName(file.name);
      dispatch({ type: ExamActionType.SET_LOADING, payload: true });
      dispatch({ type: ExamActionType.SET_ERROR, payload: null });
      
      try {
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
            const base64 = await blobToBase64(file);
            setUploadedFile({ data: base64, mimeType: file.type, name: file.name });
            setText('');
        } else {
            const content = await parseFileToText(file);
            setText(content);
            setUploadedFile(null);
        }
        setDriveUrl('');
      } catch (err: any) {
        dispatch({ type: ExamActionType.SET_ERROR, payload: "Sorry, failed to process this file. Try PDF for better results." });
      } finally {
        dispatch({ type: ExamActionType.SET_LOADING, payload: false });
      }
    }
  };

  const processDriveUrl = async () => {
    const fileId = extractFileIdFromUrl(driveUrl);
    if (!fileId) {
        dispatch({ type: ExamActionType.SET_ERROR, payload: 'Invalid Google Drive link.' });
        return;
    }
    dispatch({ type: ExamActionType.SET_LOADING, payload: true });
    try {
        const metadata = await getFileMetadata(fileId);
        setFileName(metadata.name);
        
        if (metadata.mimeType === 'application/pdf' || metadata.mimeType.startsWith('image/')) {
            const blob = await getFileBlob(fileId);
            const base64 = await blobToBase64(blob);
            setUploadedFile({ data: base64, mimeType: metadata.mimeType, name: metadata.name });
            setText('');
        } else {
            const content = await getFileContent(fileId, metadata.mimeType);
            setText(content);
            setUploadedFile(null);
        }
        dispatch({ type: ExamActionType.SET_ERROR, payload: null });
    } catch (err: any) {
        dispatch({ type: ExamActionType.SET_ERROR, payload: `Drive Error: ${err.message}` });
    } finally {
        dispatch({ type: ExamActionType.SET_LOADING, payload: false });
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => handleFile(files[0]),
    multiple: false,
    accept: { 
        'text/plain': ['.txt'], 
        'application/pdf': ['.pdf'], 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 
        'image/*': [] 
    },
    disabled: loading,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !uploadedFile && !driveUrl) {
      dispatch({ type: ExamActionType.SET_ERROR, payload: 'Please provide content first.' });
      return;
    }

    dispatch({ type: ExamActionType.SET_LOADING, payload: true });
    try {
      const existingExams = exams.filter(e => e.sourceFileName === fileName);
      const existingQs = existingExams.flatMap(e => e.questions.map(q => q.questionText));

      const input = uploadedFile 
        ? { fileData: { data: uploadedFile.data, mimeType: uploadedFile.mimeType } }
        : { text: text };

      const examData = await generateExamFromContent(input, numQuestions, numCaseQuestions, adaptiveLearning, existingQs, difficulty);
      
      const newExam: Exam = {
        ...examData,
        id: Date.now().toString(),
        questions: (examData.questions || []).map((q, i) => ({...q, id: `${Date.now()}-${i}`})),
        sourceFileName: fileName || 'Manual Entry',
        subject: fileName ? fileName.split('.')[0] : 'General'
      };
      
      dispatch({ type: ExamActionType.ADD_EXAM, payload: newExam });
      navigate(`/exam/${newExam.id}`);
    } catch (err: any) {
      dispatch({ type: ExamActionType.SET_ERROR, payload: err.message });
    } finally {
      dispatch({ type: ExamActionType.SET_LOADING, payload: false });
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-10" dir="ltr">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white">Smart Exam Generator</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 font-bold">Analyze images, charts, and PDFs to create professional MCQ tests.</p>
      </div>

      <Card className="border-none shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Difficulty Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">Challenge Level</label>
            <div className="grid grid-cols-3 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`py-3 px-4 rounded-xl text-sm font-black transition-all duration-300 flex flex-col items-center gap-1 ${
                    difficulty === level 
                    ? 'bg-white dark:bg-slate-700 shadow-xl text-primary-600 scale-105 ring-2 ring-primary-500/20' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full mb-1 ${level === 'Easy' ? 'bg-green-500' : level === 'Medium' ? 'bg-orange-500' : 'bg-red-500'}`}></span>
                  {level === 'Easy' ? 'Basic' : level === 'Medium' ? 'Intermediate' : 'Expert'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            {uploadedFile ? (
              <div className="p-6 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800 rounded-2xl flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                    <FileTextIcon className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white truncate max-w-[200px]">{uploadedFile.name}</p>
                    <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">Ready for analysis</p>
                  </div>
                </div>
                <button type="button" onClick={() => setUploadedFile(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><XCircleIcon className="w-6 h-6" /></button>
              </div>
            ) : text ? (
                <div className="space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Extracted Content</span>
                        <button type="button" onClick={() => {setText(''); setFileName('');}} className="text-slate-400 hover:text-red-500 text-xs font-bold">Change</button>
                    </div>
                    <textarea rows={6} className="w-full p-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl dark:bg-slate-900 resize-none text-sm font-medium leading-relaxed shadow-inner" value={text} onChange={(e) => setText(e.target.value)} disabled={loading} />
                </div>
            ) : (
              <div className="space-y-5 animate-fade-in">
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <input type="url" className="w-full p-4 pr-12 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 ring-primary-500/20 transition-all font-bold" placeholder="Paste Google Drive Link..." value={driveUrl} onChange={(e) => setDriveUrl(e.target.value)} disabled={loading} />
                    <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                  <Button type="button" onClick={processDriveUrl} disabled={loading || !driveUrl} variant="secondary" className="rounded-2xl px-6">Fetch</Button>
                </div>

                {!driveUrl && (
                  <>
                    <div {...getRootProps()} className={`p-12 border-4 border-dashed rounded-[40px] text-center cursor-pointer transition-all duration-500 ${isDragActive ? 'border-primary-500 bg-primary-50 scale-95 shadow-inner' : 'border-slate-100 dark:border-slate-800 hover:border-primary-300 hover:bg-slate-50/50'}`}>
                      <input {...getInputProps()} />
                      <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                        <FileTextIcon className="w-10 h-10 text-primary-600" />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Upload your file here</h3>
                      <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest leading-relaxed">PDF, Images, Word or Text</p>
                    </div>
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-slate-800"></div></div>
                        <div className="relative flex justify-center"><span className="px-4 bg-white dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest">OR</span></div>
                    </div>
                    <textarea rows={4} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl resize-none text-sm font-medium shadow-inner" placeholder="Paste text here..." value={text} onChange={(e) => setText(e.target.value)} disabled={loading} />
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Total Questions</label>
              <input type="number" min="1" max="50" value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mr-1">Case Study Questions</label>
              <input type="number" min="0" max={numQuestions} value={numCaseQuestions} onChange={(e) => setNumCaseQuestions(parseInt(e.target.value))} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black" />
            </div>
          </div>

          <Button type="submit" size="lg" disabled={loading || (!text && !uploadedFile && !driveUrl)} className="w-full h-16 rounded-[2rem] shadow-2xl shadow-primary-500/20 text-lg transition-all active:scale-95">
            {loading ? <Loader text="Analyzing content..." /> : (
              <div className="flex items-center gap-3">
                <SparklesIcon className="w-6 h-6" />
                <span className="font-black uppercase tracking-widest">Generate Exam Now</span>
              </div>
            )}
          </Button>
        </form>
      </Card>
      
      <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-40">Powered by Gemini AI</p>
    </div>
  );
}

export default CreateExamScreen;
