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

function CreateExamScreen() {
  const [text, setText] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ base64: string, mimeType: string, name: string } | null>(null);
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
            setUploadedFile({
                base64,
                mimeType: file.type,
                name: file.name
            });
            setText('');
            setDriveUrl('');
        } else {
            const content = await parseFileToText(file);
            setText(content);
            setUploadedFile(null);
            setDriveUrl('');
        }
      } catch (err: any) {
        dispatch({ type: ExamActionType.SET_ERROR, payload: err.message });
      } finally {
        dispatch({ type: ExamActionType.SET_LOADING, payload: false });
      }
    }
  };

  const processDriveUrl = async () => {
    const fileId = extractFileIdFromUrl(driveUrl);
    if (!fileId) {
        dispatch({ type: ExamActionType.SET_ERROR, payload: 'Invalid Google Drive URL. Please check the link and try again.' });
        return;
    }

    dispatch({ type: ExamActionType.SET_LOADING, payload: true });
    dispatch({ type: ExamActionType.SET_ERROR, payload: null });

    try {
        const metadata = await getFileMetadata(fileId);
        setFileName(metadata.name);

        if (metadata.mimeType === 'application/pdf' || metadata.mimeType.startsWith('image/')) {
            // Fetch as blob for multimodal
            const blob = await getFileBlob(fileId);
            const base64 = await blobToBase64(blob);
            setUploadedFile({
                base64,
                mimeType: metadata.mimeType,
                name: metadata.name
            });
            setText('');
        } else {
            // Try text extraction/export
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

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    disabled: loading,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If user has a drive URL but hasn't "processed" it yet, do it now
    if (driveUrl && !text && !uploadedFile) {
        await processDriveUrl();
        // The above sets loading to false, we need to check if it succeeded
        return; 
    }

    if (!text.trim() && !uploadedFile) {
      dispatch({ type: ExamActionType.SET_ERROR, payload: 'Please enter text, upload a file, or provide a Drive link.' });
      return;
    }

    dispatch({ type: ExamActionType.SET_LOADING, payload: true });
    dispatch({ type: ExamActionType.SET_ERROR, payload: null });
    
    try {
      const existingExamsFromFile = exams.filter(exam => exam.sourceFileName && exam.sourceFileName === fileName);
      const existingQuestions = existingExamsFromFile.flatMap(exam => exam.questions.map(q => q.questionText));

      const input = uploadedFile 
        ? { fileData: { base64: uploadedFile.base64, mimeType: uploadedFile.mimeType } }
        : { text: text };

      const examData = await generateExamFromContent(input, numQuestions, numCaseQuestions, adaptiveLearning, existingQuestions);
      const newExam: Exam = {
        ...examData,
        id: Date.now().toString(),
        questions: examData.questions.map((q, index) => ({...q, id: `${Date.now()}-${index}`})),
        sourceFileName: fileName || 'Manual Entry',
      };
      
      dispatch({ type: ExamActionType.ADD_EXAM, payload: newExam });
      navigate(`/exam/${newExam.id}`);
    } catch (err: any)      {
      dispatch({ type: ExamActionType.SET_ERROR, payload: err.message });
    } finally {
      dispatch({ type: ExamActionType.SET_LOADING, payload: false });
    }
  };

  const handleClear = () => {
      setUploadedFile(null);
      setText('');
      setFileName('');
      setDriveUrl('');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Create a New Exam</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Provide content via text, file upload, or Google Drive link.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {uploadedFile ? (
              <div className="p-6 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-lg text-primary-600">
                          <FileTextIcon className="w-8 h-8" />
                      </div>
                      <div>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{uploadedFile.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Ready for visual analysis</p>
                      </div>
                  </div>
                  <button type="button" onClick={handleClear} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                      <XCircleIcon className="w-6 h-6" />
                  </button>
              </div>
          ) : (
            <div className="space-y-4">
                <div>
                    <label htmlFor="drive-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Google Drive URL
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <input
                                id="drive-url"
                                type="url"
                                className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600"
                                placeholder="Paste link here (docs.google.com/... or drive.google.com/...)"
                                value={driveUrl}
                                onChange={(e) => setDriveUrl(e.target.value)}
                                disabled={loading}
                            />
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        </div>
                        <Button type="button" onClick={processDriveUrl} disabled={loading || !driveUrl} variant="secondary">
                            Fetch
                        </Button>
                    </div>
                </div>

                {!driveUrl && (
                    <>
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Or Paste Text</span></div>
                        </div>

                        <div>
                            <textarea
                                id="text-input"
                                rows={6}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 resize-none"
                                placeholder="Paste your content here..."
                                value={text}
                                onChange={(e) => { setText(e.target.value); setUploadedFile(null); }}
                                disabled={loading}
                            />
                        </div>

                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-slate-900 px-2 text-slate-500">Or Upload File</span></div>
                        </div>

                        <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${isDragActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.02]' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                            <input {...getInputProps()} />
                            <div className="flex flex-col items-center justify-center gap-2 text-center">
                                <FileTextIcon className="w-8 h-8 text-slate-400" />
                                <p className="font-medium text-primary-600 dark:text-primary-400">
                                    {isDragActive ? 'Drop file here...' : 'Click or Drag file to upload'}
                                </p>
                                <p className="text-xs text-slate-500">PDF, DOCX, PPTX, Images (up to 100MB)</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
          )}
          
          {(text || uploadedFile) && (
             <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm flex items-center justify-between border border-green-100 dark:border-green-800 animate-fade-in">
                <span className="text-green-800 dark:text-green-200 font-medium">✓ Content loaded from: {fileName || 'Manual Text'}</span>
                <button type="button" onClick={handleClear} className="text-green-600 hover:text-green-800 underline text-xs">Clear</button>
             </div>
          )}

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


          {error && <div className="text-red-500 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800">{error}</div>}

          <div className="pt-2">
            <Button type="submit" size="lg" disabled={loading || (!text && !uploadedFile && !driveUrl)} className="w-full shadow-lg shadow-primary-500/20">
              {loading ? <Loader text={uploadedFile ? "Analyzing file & generating exam..." : "Generating Exam..."}/> : (
                <div className="flex items-center justify-center gap-2">
                  <SparklesIcon className="w-5 h-5" />
                  <span>{driveUrl && !text && !uploadedFile ? 'Fetch & Generate' : 'Generate Exam'}</span>
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