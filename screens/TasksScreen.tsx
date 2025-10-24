import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import Button from '../components/Button';
import { PlusCircleIcon } from '../components/icons/PlusCircleIcon';

const usePersistedState = <T,>(key: string, initialState: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? JSON.parse(storedValue) : initialState;
    } catch (error) {
      console.error(error);
      return initialState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(error);
    }
  }, [key, state]);

  return [state, setState];
};


const TasksScreen: React.FC = () => {
  const [tasks, setTasks] = usePersistedState<Task[]>('tasks', []);
  const [newTask, setNewTask] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim() === '') return;
    const task: Task = { id: Date.now().toString(), text: newTask, completed: false };
    setTasks([...tasks, task]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };
  
  const deleteTask = (id: string) => {
      setTasks(tasks.filter(task => task.id !== id));
  }
  
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Keep track of your study goals and to-dos.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-lg">
        <form onSubmit={handleAddTask} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task..."
            className="flex-grow p-3 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600"
          />
          <Button type="submit" className="!px-4"><PlusCircleIcon className="w-5 h-5"/></Button>
        </form>

        <div>
            <h2 className="text-lg font-semibold mb-2">To-Do</h2>
            <div className="space-y-2">
                {pendingTasks.length > 0 ? pendingTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                )) : <p className="text-sm text-slate-400">No pending tasks. Great job!</p>}
            </div>
        </div>

        {completedTasks.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-semibold mb-2">Completed</h2>
                <div className="space-y-2">
                    {completedTasks.map(task => (
                        <TaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                    ))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

const TaskItem: React.FC<{task: Task, onToggle: (id: string) => void, onDelete: (id: string) => void}> = ({task, onToggle, onDelete}) => (
    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
        <div className="flex items-center gap-3">
            <input
                type="checkbox"
                checked={task.completed}
                onChange={() => onToggle(task.id)}
                className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className={task.completed ? 'line-through text-slate-500' : ''}>
                {task.text}
            </span>
        </div>
        <Button size="sm" variant="secondary" onClick={() => onDelete(task.id)}>Delete</Button>
    </div>
)

export default TasksScreen;