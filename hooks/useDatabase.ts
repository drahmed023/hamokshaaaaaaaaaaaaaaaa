import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export function useUserProgress() {
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProgress();
  }, []);

  const fetchUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('users_progress')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('users_progress')
          .insert([{ id: user.id }])
          .select()
          .single();

        if (insertError) throw insertError;
        setProgress(newData);
      } else {
        setProgress(data);
      }
    } catch (error) {
      console.error('Error fetching user progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (updates: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('users_progress')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      fetchUserProgress();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  return { progress, loading, updateProgress };
}

export function useExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const createExam = async (exam: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('exams')
        .insert([{ ...exam, user_id: user.id }]);

      if (error) throw error;
      fetchExams();
    } catch (error) {
      console.error('Error creating exam:', error);
    }
  };

  const deleteExam = async (id: string) => {
    try {
      const { error } = await supabase
        .from('exams')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchExams();
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
  };

  return { exams, loading, createExam, deleteExam };
}

export function useTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (task: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('tasks')
        .insert([{ ...task, user_id: user.id }]);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const updateTask = async (id: string, updates: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  return { tasks, loading, createTask, updateTask, deleteTask };
}

export function useFlashcardDecks() {
  const [decks, setDecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setDecks(data || []);
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDeck = async (deck: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('flashcard_decks')
        .insert([{ ...deck, user_id: user.id }]);

      if (error) throw error;
      fetchDecks();
    } catch (error) {
      console.error('Error creating deck:', error);
    }
  };

  const updateDeck = async (id: string, updates: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('flashcard_decks')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      fetchDecks();
    } catch (error) {
      console.error('Error updating deck:', error);
    }
  };

  const deleteDeck = async (id: string) => {
    try {
      const { error } = await supabase
        .from('flashcard_decks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDecks();
    } catch (error) {
      console.error('Error deleting deck:', error);
    }
  };

  return { decks, loading, createDeck, updateDeck, deleteDeck };
}
