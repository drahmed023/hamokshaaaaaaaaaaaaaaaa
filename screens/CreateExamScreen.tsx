
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../hooks/useExam';
import { ExamActionType, Exam } from '../types';
import { generateExamFromContent } from '../services/geminiService';
import { parseFileToText, blobToBase64 } from '../utils/fileParser';
import Button from '../components/Button';
import Card from '../components/Card';
import { FileTextIcon } from '../components/icons/FileTextIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { useDropzone } from 'react-dropzone';
import { XCircleIcon } from '../components/icons/XCircleIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';
import { GraduationCapIcon } from '../components/icons/GraduationCapIcon';

function CreateExamScreen() {
  const [text, setText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ data: string, mimeType: string, name: string } | null>(null);
  const [numNormal, setNumNormal] = useState(10);
  const [numScenario, setNumScenario] = useState(5);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [fileName, setFileName] = useState('');
  const { loading, dispatch } = useExam();
  const navigate = useNavigate();

  const handleFile = async (file: File) => {
    if (file) {
      setFileName(file.name);
      dispatch({ type: ExamActionType.SET_LOADING, payload: true });
      try {
        if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
            const base64 = await blobToBase64(file);
            setUploadedFile({ data: base64, mimeType: file.type, name: file.name });
        } else {
            const content = await parseFileToText(file);
            setText(content);
            setUploadedFile(null);
        }
      } catch (err: any) {
        alert("File Error: " + err.message);
      } finally {
        dispatch({ type: ExamActionType.SET_LOADING, payload: false });
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => handleFile(files[0]),
    multiple: false,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'], 'image/*': [] },
    disabled: loading,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !uploadedFile) return;

    dispatch({ type: ExamActionType.SET_LOADING, payload: true });
    try {
      const input = uploadedFile ? { fileData: { data: uploadedFile.data, mimeType: uploadedFile.mimeType } } : { text };
      const examData = await generateExamFromContent(input, numNormal, numScenario, false, [], difficulty);
      
      const newExam: Exam = {
        id: Date.now().toString(),
        title: examData.title || fileName || 'New MCQ Exam',
        questions: (examData.questions || []).map((q, i) => ({ ...q, id: `${Date.now()}-${i}` })),
        sourceFileName: fileName || 'Manual Input',
        subject: 'Academic'
      };

      dispatch({ type: ExamActionType.ADD_EXAM, payload: newExam });
      navigate(`/exam/${newExam.id}`);
    } catch (err: any) {
      alert("AI Error: " + err.message);
    } finally {
      dispatch({ type: ExamActionType.SET_LOADING, payload: false });
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 px-4" dir="auto">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Exam Builder</h1>
        <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-[0.4em]">Convert clinical material into smart assessments</p>
      </div>

      <Card className="border-none shadow-2xl overflow-hidden p-8 md:p-12 bg-white/80 backdrop-blur-xl">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div {...getRootProps()} className={`p-16 border-4 border-dashed rounded-[3rem] text-center cursor-pointer transition-all duration-500 ${isDragActive ? 'border-primary-500 bg-primary-50 scale-95' : uploadedFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 hover:border-primary-300'}`}>
            <input {...getInputProps()} />
            {uploadedFile ? (
                <div className="space-y-2">
                    <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto" />
                    <p className="font-black text-slate-900">{uploadedFile.name}</p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Document Secured</p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
                        <FileTextIcon className="w-10 h-10 text-primary-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Drop PDF / DOCX</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-[0.2em]">Clinical documents or lecture notes</p>
                    </div>
                </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <ClipboardListIcon className="w-5 h-5 text-primary-500" />
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Direct Questions</label>
                </div>
                <input type="number" value={numNormal} onChange={(e) => setNumNormal(Number(e.target.value))} className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-xl text-center focus:ring-4 ring-primary-500/10 transition-all" />
            </div>
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <GraduationCapIcon className="w-5 h-5 text-amber-500" />
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Case Scenarios</label>
                </div>
                <input type="number" value={numScenario} onChange={(e) => setNumScenario(Number(e.target.value))} className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black text-xl text-center focus:ring-4 ring-amber-500/10 transition-all" />
            </div>
          </div>

          <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-1">Cognitive Difficulty</label>
                <div className="grid grid-cols-3 gap-3">
                    {['Easy', 'Medium', 'Hard'].map((lv) => (
                        <button key={lv} type="button" onClick={() => setDifficulty(lv as any)} className={`p-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all border-2 ${difficulty === lv ? 'bg-primary-600 border-primary-700 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                            {lv}
                        </button>
                    ))}
                </div>
          </div>

          <Button type="submit" disabled={loading || (!text && !uploadedFile)} className="w-full h-24 rounded-[2.5rem] shadow-2xl shadow-primary-500/30 transition-all active:scale-95 text-xl">
            {loading ? (
                <div className="flex items-center gap-6">
                    <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
                    <span className="font-black uppercase tracking-[0.3em] text-sm">Building Clinical Exam...</span>
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    <SparklesIcon className="w-8 h-8" />
                    <span className="font-black uppercase tracking-[0.2em] text-lg">Generate AI Test</span>
                </div>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
  );
}

export default CreateExamScreen;
