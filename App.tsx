import React, { useState, ReactNode } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ExamProvider } from './context/ExamContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomeScreen from './screens/HomeScreen';
import CreateExamScreen from './screens/CreateExamScreen';
import TakeExamScreen from './screens/TakeExamScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';
import { StudyAidsProvider } from './context/StudyAidsContext';
import StudyAidsScreen from './screens/StudyAidsScreen';
import SavedItemsScreen from './screens/SavedItemsScreen';
import FlashcardReviewScreen from './screens/FlashcardReviewScreen';
import CalendarScreen from './screens/CalendarScreen';
import TasksScreen from './screens/TasksScreen';
import { TasksProvider } from './context/TasksContext';
import SettingsScreen from './screens/SettingsScreen';
import SummaryDetailScreen from './screens/SummaryDetailScreen';
import MindMapScreen from './screens/MindMapScreen';
import { StudyPlanProvider } from './context/StudyPlanContext';
import StudyPlanScreen from './screens/StudyPlanScreen';
import { GamificationProvider } from './context/GamificationContext';
import AchievementsScreen from './screens/AchievementsScreen';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/ToastContainer';
import { AvatarProvider } from './context/AvatarContext';
import AICompanion from './components/AICompanion';
import AnalyticsScreen from './screens/AnalyticsScreen';
import ExplainerScreen from './screens/ExplainerScreen';
import { MusicProvider } from './context/MusicContext';
import MusicPlayer from './components/MusicPlayer';
import { useGamification } from './hooks/useGamification';
import { SmartSettingsProvider } from './context/SmartSettingsContext';
import { AIInteractionProvider } from './context/AIInteractionContext';
import { PomodoroProvider } from './context/PomodoroContext';
import GoogleDriveScreen from './screens/GoogleDriveScreen';
import NotionScreen from './screens/NotionScreen';
import DiagramExplainerScreen from './screens/DiagramExplainerScreen';
import ActionableNotification from './components/ActionableNotification';
import AISchedulingModal from './components/AISchedulingModal';
import { BookmarkProvider } from './context/BookmarkContext';
import BookmarkedQuestionsScreen from './screens/BookmarkedQuestionsScreen';
import { NotesProvider } from './context/NotesContext';
import { HighlightProvider } from './context/HighlightContext';

// This component contains the entire UI logic.
// It sits inside all providers, so it has access to all contexts.
function AppUI() {
    const { background, focusMode } = useTheme();
    const { level } = useGamification();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const backgroundClass = background === 'default' 
        ? `level-bg level-bg-${Math.min(level, 5)}`
        : `bg-${background}`;
    
    const focusClass = focusMode ? 'focus-mode' : '';

    return (
        <div className={`main-bg-transition min-h-screen ${backgroundClass} ${focusClass}`}>
            <div className="bg-white/10 dark:bg-black/10 min-h-screen">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                <main className="container mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<HomeScreen />} />
                        <Route path="/create-exam" element={<CreateExamScreen />} />
                        <Route path="/exam/:id" element={<TakeExamScreen />} />
                        <Route path="/results/:id" element={<ResultsScreen />} />
                        <Route path="/history" element={<HistoryScreen />} />
                        <Route path="/study-aids" element={<StudyAidsScreen />} />
                        <Route path="/saved-items" element={<SavedItemsScreen />} />
                        <Route path="/review/deck/:deckId" element={<FlashcardReviewScreen />} />
                        <Route path="/summary/:summaryId" element={<SummaryDetailScreen />} />
                        <Route path="/mind-map/:mindMapId" element={<MindMapScreen />} />
                        <Route path="/calendar" element={<CalendarScreen />} />
                        <Route path="/tasks" element={<TasksScreen />} />
                        <Route path="/settings" element={<SettingsScreen />} />
                        <Route path="/study-plan" element={<StudyPlanScreen />} />
                        <Route path="/achievements" element={<AchievementsScreen />} />
                        <Route path="/analytics" element={<AnalyticsScreen />} />
                        <Route path="/explainer" element={<ExplainerScreen />} />
                        <Route path="/diagram-explainer" element={<DiagramExplainerScreen />} />
                        <Route path="/drive" element={<GoogleDriveScreen />} />
                        <Route path="/notion" element={<NotionScreen />} />
                        <Route path="/bookmarks" element={<BookmarkedQuestionsScreen />} />
                    </Routes>
                </main>
                <AICompanion />
                <ActionableNotification />
                <AISchedulingModal />
                <ToastContainer />
                <MusicPlayer />
            </div>
        </div>
    );
}

// FIX: Inlined providers to resolve a cascade of 'children' prop type errors
// that likely originated from deep nesting and TypeScript type inference issues.
// RE-FIX: Converted from a const arrow function to a function declaration to help
// TypeScript's type inference with deeply nested components.
// FIX: Made the children prop optional to fix a TypeScript error.
function AppProviders({ children }: { children?: React.ReactNode }) {
  return (
    <ToastProvider>
      <ThemeProvider>
        <AvatarProvider>
          <MusicProvider>
            <GamificationProvider>
              <TasksProvider>
                <ExamProvider>
                  <StudyAidsProvider>
                    <BookmarkProvider>
                      <NotesProvider>
                        <HighlightProvider>
                          <StudyPlanProvider>
                            <SmartSettingsProvider>
                              <AIInteractionProvider>
                                <PomodoroProvider>
                                  {children}
                                </PomodoroProvider>
                              </AIInteractionProvider>
                            </SmartSettingsProvider>
                          </StudyPlanProvider>
                        </HighlightProvider>
                      </NotesProvider>
                    </BookmarkProvider>
                  </StudyAidsProvider>
                </ExamProvider>
              </TasksProvider>
            </GamificationProvider>
          </MusicProvider>
        </AvatarProvider>
      </ThemeProvider>
    </ToastProvider>
  );
}

function App() {
  return (
    <Router>
      <AppProviders>
        <AppUI />
      </AppProviders>
    </Router>
  );
}

export default App;