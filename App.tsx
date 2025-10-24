import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ExamProvider } from './context/ExamContext';
import { ThemeProvider } from './context/ThemeContext';
import { StudyAidsProvider } from './context/StudyAidsContext';

import Header from './components/Header';
import HomeScreen from './screens/HomeScreen';
import CreateExamScreen from './screens/CreateExamScreen';
import TakeExamScreen from './screens/TakeExamScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';
import PomodoroScreen from './screens/PomodoroScreen';
import StudyAidsScreen from './screens/StudyAidsScreen';
import SavedItemsScreen from './screens/SavedItemsScreen';
import FlashcardReviewScreen from './screens/FlashcardReviewScreen';
import CalendarScreen from './screens/CalendarScreen';
import TasksScreen from './screens/TasksScreen';


function App() {
  return (
    <ThemeProvider>
      <ExamProvider>
        <StudyAidsProvider>
          <Router>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 transition-colors duration-200">
              <Header />
              <main className="container mx-auto p-4 md:p-8">
                <Routes>
                  <Route path="/" element={<HomeScreen />} />
                  <Route path="/create-exam" element={<CreateExamScreen />} />
                  <Route path="/exam/:id" element={<TakeExamScreen />} />
                  <Route path="/results/:id" element={<ResultsScreen />} />
                  <Route path="/history" element={<HistoryScreen />} />
                  <Route path="/study-aids" element={<StudyAidsScreen />} />
                  <Route path="/pomodoro" element={<PomodoroScreen />} />
                  <Route path="/saved-items" element={<SavedItemsScreen />} />
                  <Route path="/flashcard-review/:deckId" element={<FlashcardReviewScreen />} />
                  <Route path="/calendar" element={<CalendarScreen />} />
                  <Route path="/tasks" element={<TasksScreen />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </Router>
        </StudyAidsProvider>
      </ExamProvider>
    </ThemeProvider>
  );
}

export default App;