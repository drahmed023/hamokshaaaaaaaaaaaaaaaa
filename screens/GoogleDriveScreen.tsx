import React, { useState, useEffect, useMemo } from 'react';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { FolderIcon } from '../components/icons/FolderIcon';
import { ChevronRightIcon } from '../components/icons/ChevronRightIcon';
import { listItems, isFileContentSupported, GoogleDriveFile } from '../services/googleDriveService';
import FileViewerModal from '../components/FileViewerModal';
import Button from '../components/Button';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { SearchIcon } from '../components/icons/SearchIcon';
import { PdfIcon } from '../components/icons/PdfIcon';
import { DocIcon } from '../components/icons/DocIcon';
import { TxtIcon } from '../components/icons/TxtIcon';

interface PathSegment {
  id: string;
  name: string;
}

const ROOT_FOLDER_ID = '1gb2xHo-rr2OSIJHBsVxUGm01SLsyxgcV';

const FileTypeIcon = ({ mimeType, iconLink }: { mimeType: string, iconLink: string }) => {
    switch (mimeType) {
        case 'application/pdf':
            return <PdfIcon className="w-6 h-6 mr-4 flex-shrink-0" />;
        case 'application/vnd.google-apps.document':
            return <DocIcon className="w-6 h-6 mr-4 flex-shrink-0" />;
        case 'text/plain':
            return <TxtIcon className="w-6 h-6 mr-4 flex-shrink-0" />;
        default:
            return <img src={iconLink} alt="" className="w-6 h-6 mr-4 flex-shrink-0" />;
    }
};

function GoogleDriveScreen() {
  const [items, setItems] = useState<GoogleDriveFile[]>([]);
  const [path, setPath] = useState<PathSegment[]>([{ id: ROOT_FOLDER_ID, name: 'Root Folder' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const currentFolderId = path[path.length - 1].id;

  useEffect(() => {
    const fetchDriveItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedItems = await listItems(currentFolderId);
        setItems(fetchedItems);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDriveItems();
  }, [currentFolderId]);

  const handleFolderClick = (folder: GoogleDriveFile) => {
    setPath(prevPath => [...prevPath, { id: folder.id, name: folder.name }]);
    setSearchTerm(''); // Reset search when changing folders
  };

  const handleBreadcrumbClick = (index: number) => {
    setPath(prevPath => prevPath.slice(0, index + 1));
    setSearchTerm('');
  };
  
  const handleFileClick = (file: GoogleDriveFile) => {
    if (isFileContentSupported(file.mimeType)) {
        setSelectedFile(file);
        setIsModalOpen(true);
    } else {
        window.open(file.webViewLink, '_blank');
    }
  };
  
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [items, searchTerm]);

  const Breadcrumbs = () => (
    <nav className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-4 flex-wrap">
      {path.map((segment, index) => (
        <React.Fragment key={segment.id}>
          {index > 0 && <ChevronRightIcon className="w-4 h-4 mx-1 flex-shrink-0" />}
          <button
            onClick={() => handleBreadcrumbClick(index)}
            disabled={index === path.length - 1}
            className={`hover:text-primary-600 dark:hover:text-primary-400 disabled:hover:text-slate-500 disabled:dark:hover:text-slate-400 disabled:cursor-default ${index === path.length - 1 ? 'text-slate-800 dark:text-slate-200 font-semibold' : ''}`}
          >
            {segment.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );

  return (
    <>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Google Drive Files</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Browse files and generate study materials with AI.</p>
        </div>

        <Card>
          <Breadcrumbs />
          <div className="relative mb-4">
            <input
              type="search"
              placeholder="ابحث في المجلد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-700 dark:border-slate-600"
            />
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
          {loading ? (
            <Loader text="Fetching files from Google Drive..." />
          ) : error ? (
            <div className="text-center text-red-500 p-8">
              <p className="font-bold">An error occurred:</p>
              <p>{error}</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center text-slate-500 dark:text-slate-400 p-12">
              <FolderIcon className="w-16 h-16 mx-auto text-slate-400" />
              <h2 className="text-xl font-bold mt-4">{searchTerm ? 'No results found' : 'Folder is Empty'}</h2>
              <p className="mt-2">{searchTerm ? `Your search for "${searchTerm}" did not match any files or folders.` : 'There are no files or folders here.'}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {filteredItems.map(item => {
                const isFolder = item.mimeType === 'application/vnd.google-apps.folder';
                const isSupported = isFileContentSupported(item.mimeType);
                return (
                  <li key={item.id}>
                    {isFolder ? (
                      <button
                        onClick={() => handleFolderClick(item)}
                        className="w-full flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
                      >
                        <FolderIcon className="w-6 h-6 mr-4 text-primary-500" />
                        <span className="flex-grow font-medium text-slate-800 dark:text-slate-100">{item.name}</span>
                        <ChevronRightIcon className="w-5 h-5 text-slate-400" />
                      </button>
                    ) : (
                      <div className="flex items-center p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <FileTypeIcon mimeType={item.mimeType} iconLink={item.iconLink} />
                        <span className="flex-grow font-medium text-slate-800 dark:text-slate-100 truncate">{item.name}</span>
                        <div className="ml-4 flex-shrink-0">
                          {isSupported ? (
                             <Button onClick={() => handleFileClick(item)} size="sm">
                                <SparklesIcon className="w-4 h-4 mr-1.5" />
                                View & Use
                             </Button>
                          ) : (
                             <Button onClick={() => handleFileClick(item)} size="sm" variant="secondary">Open</Button>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
      <FileViewerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        file={selectedFile}
      />
    </>
  );
}

export default GoogleDriveScreen;