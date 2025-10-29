





import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudyAids } from '../hooks/useStudyAids';
import InteractiveMindMap from '../components/InteractiveMindMap';
import { MindMap, StudyAidsActionType } from '../types';
import Button from '../components/Button';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { TrashIcon } from '../components/icons/TrashIcon';

function MindMapScreen() {
  const { mindMapId } = useParams<{ mindMapId: string }>();
  const navigate = useNavigate();
  const { mindMaps, dispatch } = useStudyAids();

  const mindMap = mindMaps.find(m => m.id === mindMapId);

  const [editableTitle, setEditableTitle] = useState(mindMap?.title || '');

  if (!mindMap) {
    return (
      <div className="text-center">
        <h2 className="text-2xl font-bold">Mind Map Not Found</h2>
        {/* Fix: Added children to Button component to resolve missing prop error. */}
        <Button onClick={() => navigate('/saved-items')} className="mt-4">
          Back to Saved Items
        </Button>
      </div>
    );
  }
  
  const handleTitleBlur = () => {
    if (editableTitle.trim() && editableTitle.trim() !== mindMap.title) {
        const updatedMindMap: MindMap = { ...mindMap, title: editableTitle.trim() };
        dispatch({ type: StudyAidsActionType.UPDATE_MIND_MAP, payload: updatedMindMap });
    } else {
        setEditableTitle(mindMap.title); // Revert if empty
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${mindMap.title}"?`)) {
      dispatch({ type: StudyAidsActionType.DELETE_MIND_MAP, payload: mindMap.id });
      navigate('/saved-items');
    }
  };


  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
       <div className="flex justify-between items-center mb-4 flex-shrink-0">
            {/* Fix: Added children to Button component to resolve missing prop error. */}
            <Button onClick={() => navigate('/saved-items')} variant="secondary" className="flex items-center">
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Back
            </Button>
            <input 
                type="text"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="text-xl font-bold bg-transparent text-center focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1"
            />
            {/* Fix: Added children to Button component to resolve missing prop error. */}
            <Button onClick={handleDelete} variant="danger" size="sm" className="!p-2">
                <TrashIcon className="w-5 h-5" />
            </Button>
        </div>
      <div className="flex-grow w-full h-full bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
        <InteractiveMindMap root={mindMap.root} />
      </div>
    </div>
  );
};

export default MindMapScreen;