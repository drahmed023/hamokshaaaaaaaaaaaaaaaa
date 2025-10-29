





import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudyAids } from '../hooks/useStudyAids';
import { StudyAidsActionType, Summary } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import { ChevronLeftIcon } from '../components/icons/ChevronLeftIcon';
import { HighlightIcon } from '../components/icons/HighlightIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { TrashIcon } from '../components/icons/TrashIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { getHighlights } from '../services/geminiService';
import Loader from '../components/Loader';

function SummaryDetailScreen() {
    const { summaryId } = useParams<{ summaryId: string }>();
    const { summaries, dispatch } = useStudyAids();
    const navigate = useNavigate();

    const summary = summaries.find(s => s.id === summaryId);

    const [editableTitle, setEditableTitle] = useState(summary?.title || '');
    const [isEditingContent, setIsEditingContent] = useState(false);
    const [editableContent, setEditableContent] = useState(summary?.content || '');
    const [isHighlighting, setIsHighlighting] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    
    // Helper to escape regex special characters
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
    }

    useEffect(() => {
        if (summary) {
            setEditableTitle(summary.title);
            // When content is not being edited, ensure the state reflects the potentially updated (e.g., highlighted) content from context
            if (!isEditingContent) {
                 setEditableContent(summary.content);
            }
        }
    }, [summary, isEditingContent]);

    if (!summary) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-bold">Summary Not Found</h2>
                {/* Fix: Added children to Button component to resolve missing prop error. */}
                <Button onClick={() => navigate('/saved-items')} className="mt-4">Back to Saved Items</Button>
            </div>
        );
    }

    const handleTitleBlur = () => {
        if (editableTitle.trim() && editableTitle.trim() !== summary.title) {
            const updatedSummary: Summary = { ...summary, title: editableTitle.trim() };
            dispatch({ type: StudyAidsActionType.UPDATE_SUMMARY, payload: updatedSummary });
        } else {
            setEditableTitle(summary.title); // Revert if empty or unchanged
        }
    };
    
    const handleSaveContent = () => {
        if (editableContent !== summary.content) {
             const updatedSummary: Summary = { ...summary, content: editableContent };
             dispatch({ type: StudyAidsActionType.UPDATE_SUMMARY, payload: updatedSummary });
        }
        setIsEditingContent(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to delete "${summary.title}"?`)) {
            dispatch({ type: StudyAidsActionType.DELETE_SUMMARY, payload: summary.id });
            navigate('/saved-items');
        }
    };
    
    const handleManualHighlight = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.toString().trim() === '') return;

        const range = selection.getRangeAt(0);
        
        if (contentRef.current && contentRef.current.contains(range.commonAncestorContainer)) {
            try {
                const mark = document.createElement('mark');
                mark.className = 'highlight';
                
                range.surroundContents(mark);
                
                if (contentRef.current) {
                    const newContent = contentRef.current.innerHTML;
                    const updatedSummary: Summary = { ...summary, content: newContent };
                    dispatch({ type: StudyAidsActionType.UPDATE_SUMMARY, payload: updatedSummary });
                }
            } catch (error) {
                console.error("Highlighting failed:", error);
                alert("Could not apply highlight. Please try selecting a different portion of text.");
            } finally {
                selection.removeAllRanges(); // Always clear selection
            }
        }
    };
    
    const handleAiHighlight = async () => {
        setIsHighlighting(true);
        try {
            const textOnlyContent = summary.content.replace(/<[^>]*>?/gm, '');
            const highlights = await getHighlights(textOnlyContent);
            
            let newContent = summary.content;
            highlights.forEach(h => {
                // Use a regex to replace all occurrences, ignoring case, but preserving the original casing in the replacement.
                const regex = new RegExp(escapeRegExp(h), 'gi');
                newContent = newContent.replace(regex, (match) => `<mark class="highlight">${match}</mark>`);
            });

            const updatedSummary: Summary = { ...summary, content: newContent };
            dispatch({ type: StudyAidsActionType.UPDATE_SUMMARY, payload: updatedSummary });

        } catch (error) {
            console.error("AI highlighting failed:", error);
            alert("The AI could not generate highlights for this text. Please try again.");
        } finally {
            setIsHighlighting(false);
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                {/* Fix: Added children to Button component to resolve missing prop error. */}
                <Button onClick={() => navigate('/saved-items')} variant="secondary">
                    <ChevronLeftIcon className="w-5 h-5 mr-1" />
                    Back to Saved Items
                </Button>
            </div>
            
            {/* Fix: Added children to Card component to resolve missing prop error. */}
            <Card>
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4 mb-4 gap-4 flex-wrap">
                     <input 
                        type="text"
                        value={editableTitle}
                        onChange={(e) => setEditableTitle(e.target.value)}
                        onBlur={handleTitleBlur}
                        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                        className="text-2xl md:text-3xl font-bold bg-transparent w-full focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md -m-2 p-2 flex-grow"
                     />
                     <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Fix: Added children to Button components to resolve missing prop errors. */}
                        <Button onClick={handleManualHighlight} variant="secondary" size="sm" className="!p-2" aria-label="Highlight selected text">
                            <HighlightIcon className="w-5 h-5" />
                        </Button>
                        <Button onClick={handleAiHighlight} variant="secondary" size="sm" className="!p-2" aria-label="AI Highlight" disabled={isHighlighting}>
                            {isHighlighting ? <Loader text='' /> : <SparklesIcon className="w-5 h-5" />}
                        </Button>
                        <Button onClick={() => setIsEditingContent(!isEditingContent)} variant={isEditingContent ? "primary" : "secondary"} size="sm" className="!p-2" aria-label="Edit content">
                            <EditIcon className="w-5 h-5" />
                        </Button>
                         <Button onClick={handleDelete} variant="danger" size="sm" className="!p-2" aria-label="Delete summary">
                            <TrashIcon className="w-5 h-5" />
                        </Button>
                     </div>
                </div>

                {isEditingContent ? (
                    <div>
                        <textarea
                            value={editableContent}
                            onChange={(e) => setEditableContent(e.target.value)}
                            rows={15}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-slate-900 dark:border-slate-600 prose prose-lg dark:prose-invert max-w-none"
                        />
                        <div className="mt-4 flex justify-end gap-2">
                            {/* Fix: Added children to Button components to resolve missing prop errors. */}
                            <Button variant="secondary" onClick={() => { setIsEditingContent(false); setEditableContent(summary.content); }}>Cancel</Button>
                            <Button onClick={handleSaveContent}>Save Content</Button>
                        </div>
                    </div>
                ) : (
                    <div 
                        ref={contentRef}
                        className="prose prose-lg dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: summary.content }}
                    />
                )}
            </Card>
        </div>
    );
};

export default SummaryDetailScreen;