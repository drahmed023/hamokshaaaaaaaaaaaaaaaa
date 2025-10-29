import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';
import Button from './Button';
import { getFileContent } from '../services/googleDriveService';
import { XCircleIcon } from './icons/XCircleIcon';
import { GoogleDriveFile } from '../services/googleDriveService';

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: GoogleDriveFile | null;
}

function FileViewerModal({ isOpen, onClose, file }: FileViewerModalProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && file) {
      setLoading(true);
      setError(null);
      setContent('');
      getFileContent(file.id, file.mimeType)
        .then(text => setContent(text))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, file]);

  const handleCreateExam = () => {
    navigate('/create-exam', { state: { content, fileName: file?.name } });
    onClose();
  };
  
  const handleCreateAids = () => {
    navigate('/study-aids', { state: { content, fileName: file?.name } });
    onClose();
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl h-[90vh] m-4 flex flex-col">
        <header className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold truncate">{file.name}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-grow p-6 overflow-y-auto">
          {loading && <Loader text="Loading file content..." />}
          {error && <p className="text-red-500">Error: {error}</p>}
          {content && <pre className="whitespace-pre-wrap font-sans">{content}</pre>}
        </main>
        <footer className="flex justify-end items-center p-4 border-t border-slate-200 dark:border-slate-700 gap-2">
          <Button onClick={() => window.open(file.webViewLink, '_blank')} variant="secondary">Open in Drive</Button>
          <Button onClick={handleCreateAids}>Create Study Aids</Button>
          <Button onClick={handleCreateExam}>Create Exam</Button>
        </footer>
      </div>
    </div>
  );
}

export default FileViewerModal;