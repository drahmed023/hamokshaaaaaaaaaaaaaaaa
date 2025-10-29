





import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { TasksActionType, Task } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import { TrashIcon } from '../components/icons/TrashIcon';
import { EditIcon } from '../components/icons/EditIcon';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';
import { ListChecksIcon } from '../components/icons/ListChecksIcon';
import { ClipboardListIcon } from '../components/icons/ClipboardListIcon';

function TasksScreen() {
  const { tasks, dispatch } = useTasks();
  const [newTaskText, setNewTaskText] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      dispatch({
        type: TasksActionType.ADD_TASK,
        // FIX: Added source property to align with the updated Task type.
        payload: { id: Date.now().toString(), text: newTaskText, completed: false, source: 'user' },
      });
      setNewTaskText('');
    }
  };
  
  const handleEdit = (task: {id: string, text: string}) => {
      setEditingTaskId(task.id);
      setEditingTaskText(task.text);
  };
  
  const handleSaveEdit = (id: string) => {
    if (editingTaskText.trim()) {
        dispatch({ type: TasksActionType.EDIT_TASK, payload: { id, text: editingTaskText } });
        setEditingTaskId(null);
        setEditingTaskText('');
    }
  };
  
  const completedTasks = tasks.filter(t => t.completed);
  const pendingTasks = tasks.filter(t => !t.completed);

  const renderTask = (task: Task) => (
    <li key={task.id} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => dispatch({ type: TasksActionType.TOGGLE_TASK, payload: task.id })}
        className="w-5 h-5 mt-1 rounded text-primary-600 focus:ring-primary-500"
      />
      <div className="flex-grow">
        {editingTaskId === task.id ? (
          <input
            type="text"
            value={editingTaskText}
            onChange={e => setEditingTaskText(e.target.value)}
            onBlur={() => handleSaveEdit(task.id)}
            onKeyDown={e => e.key === 'Enter' && handleSaveEdit(task.id)}
            autoFocus
            className="w-full bg-transparent focus:outline-none"
          />
        ) : (
          <span className={`${task.completed ? 'line-through text-slate-500 dark:text-slate-400' : ''}`}>
            {task.text}
          </span>
        )}
        <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
            {task.dueDate && (
                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            )}
            {task.source === 'study_plan' && (
                <div className="flex items-center gap-1">
                    <ClipboardListIcon className="w-3 h-3" />
                    <span>Study Plan</span>
                </div>
            )}
        </div>
      </div>
      <div className="flex-shrink-0">
        {!task.completed && <button onClick={() => handleEdit(task)} className="p-1 text-slate-500 hover:text-primary-500"><EditIcon className="w-4 h-4" /></button>}
        <button onClick={() => dispatch({ type: TasksActionType.DELETE_TASK, payload: task.id })} className="p-1 text-slate-500 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
      </div>
    </li>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Manage Your Tasks</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Stay organized and on track with your study goals.</p>
      </div>

      {/* Fix: Added children to Card component to resolve missing prop error. */}
      <Card>
        <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a new study task..."
            className="w-full p-3 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
          />
          {/* Fix: Added children to Button component to resolve missing prop error. */}
          <Button type="submit" className="flex-shrink-0">
             <PlusCircleIcon className="w-5 h-5" />
          </Button>
        </form>

        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <ListChecksIcon className="w-5 h-5"/>
            Pending Tasks ({pendingTasks.length})
        </h2>
        <ul className="space-y-2">
          {pendingTasks.map(renderTask)}
        </ul>

        {completedTasks.length > 0 && (
            <>
                <h2 className="text-lg font-semibold mb-2 mt-6 flex items-center gap-2">
                    Completed Tasks ({completedTasks.length})
                </h2>
                <ul className="space-y-2">
                {completedTasks.map(renderTask)}
                </ul>
            </>
        )}
      </Card>
    </div>
  );
};

export default TasksScreen;