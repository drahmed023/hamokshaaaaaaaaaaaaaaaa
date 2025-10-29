





import React, { useState, useEffect } from 'react';
import { useAIInteraction } from '../hooks/useAIInteraction';
import { useTasks } from '../hooks/useTasks';
import { AIInteractionActionType, TasksActionType } from '../types';
import Button from './Button';
import { BotIcon } from './icons/BotIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { XCircleIcon } from './icons/XCircleIcon';

function AISchedulingModal() {
    const { schedulingModal, dispatch: interactionDispatch } = useAIInteraction();
    const { dispatch: tasksDispatch } = useTasks();
    const [taskText, setTaskText] = useState('');
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if (schedulingModal.isOpen) {
            setTaskText(schedulingModal.taskDescription);
            setDueDate(schedulingModal.dueDate || '');
        }
    }, [schedulingModal]);

    const handleClose = () => {
        interactionDispatch({ type: AIInteractionActionType.HIDE_INTERACTION });
    };

    const handleSave = () => {
        if (taskText.trim()) {
            tasksDispatch({
                type: TasksActionType.ADD_TASK,
                payload: {
                    id: Date.now().toString(),
                    text: taskText,
                    completed: false,
                    dueDate: dueDate || undefined,
                    source: 'user',
                },
            });
            handleClose();
        }
    };

    if (!schedulingModal.isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <BotIcon className="w-5 h-5 text-primary-500" />
                        AI Suggests a Task
                    </h2>
                    <button onClick={handleClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                       <XCircleIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div>
                    <label htmlFor="task-desc" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Task Description</label>
                    <textarea
                        id="task-desc"
                        rows={3}
                        value={taskText}
                        onChange={(e) => setTaskText(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    />
                </div>
                <div className="mt-4">
                    <label htmlFor="due-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Due Date (Optional)</label>
                    <div className="relative">
                        <input
                            id="due-date"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600 pr-10"
                        />
                        <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    {/* Fix: Added children to Button components to resolve missing prop errors. */}
                    <Button onClick={handleClose} variant="secondary">Cancel</Button>
                    <Button onClick={handleSave}>Add Task</Button>
                </div>
            </div>
        </div>
    );
};

export default AISchedulingModal;