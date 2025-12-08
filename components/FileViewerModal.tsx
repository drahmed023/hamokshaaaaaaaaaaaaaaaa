
import React, { useState, useEffect, useRef } from 'react';
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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && file) {
      // Center the modal on open
      if (modalRef.current) {
        const { clientWidth, clientHeight } = document.documentElement;
        const modalWidth = Math.min(clientWidth * 0.8, 768); // 80% of vw, max 768px
        const modalHeight = clientHeight * 0.8;
        setPosition({
            x: (clientWidth - modalWidth) / 2,
            y: (clientHeight - modalHeight) / 2,
        });
      }

      setLoading(true);
      setError(null);
      setContent('');
      getFileContent(file.id, file.mimeType)
        .then(text => setContent(text))
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [isOpen, file]);

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) return; // Prevent drag from buttons inside header
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  useEffect(() => {
    if (isDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

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
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div 
        ref={modalRef}
        className="absolute bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col pointer-events-auto"
        style={{ top: `${position.y}px`, left: `${position.x}px`}}
      >
        <header
          className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 cursor-move bg-white/50 dark:bg-black/20"
          onMouseDown={handleMouseDown}
        >
          <h2 className="text-lg font-bold truncate select-none text-slate-900 dark:text-white">{file.name}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer">
            <XCircleIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="flex-grow p-6 overflow-y-auto bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
          {loading && <Loader text="Loading file content..." />}
          {error && <p className="text-red-500">Error: {error}</p>}
          {content && <pre className="whitespace-pre-wrap font-sans">{content}</pre>}
        </main>
        <footer className="flex justify-end items-center p-4 border-t border-slate-200 dark:border-slate-700 gap-2 bg-white/50 dark:bg-black/20">
          <Button onClick={() => window.open(file.webViewLink, '_blank')} variant="secondary">Open in Drive</Button>
          <Button onClick={handleCreateAids}>Create Study Aids</Button>
          <Button onClick={handleCreateExam}>Create Exam</Button>
        </footer>
      </div>
    </div>
  );
}

export default FileViewerModal;
