
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { useTheme } from './hooks/useTheme';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HomeScreen from './screens/HomeScreen';
import CreateExamScreen from './screens/CreateExamScreen';
import TakeExamScreen from './screens/TakeExamScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';
import StudyAidsScreen from './screens/StudyAidsScreen';
import SavedItemsScreen from './screens/SavedItemsScreen';
import FlashcardReviewScreen from './screens/FlashcardReviewScreen';
import CalendarScreen from './screens/CalendarScreen';
import TasksScreen from './screens/TasksScreen';
import SettingsScreen from './screens/SettingsScreen';
import SummaryDetailScreen from './screens/SummaryDetailScreen';
import MindMapScreen from './screens/MindMapScreen';
import AchievementsScreen from './screens/AchievementsScreen';
import ToastContainer from './components/ToastContainer';
import AICompanion from './components/AICompanion';
import AnalyticsScreen from './screens/AnalyticsScreen';
import ExplainerScreen from './screens/ExplainerScreen';
import MusicPlayer from './components/MusicPlayer';
import { useGamification } from './hooks/useGamification';
import GoogleDriveScreen from './screens/GoogleDriveScreen';
import NotionScreen from './screens/NotionScreen';
import DiagramExplainerScreen from './screens/DiagramExplainerScreen';
import ActionableNotification from './components/ActionableNotification';
import AISchedulingModal from './components/AISchedulingModal';
import BookmarkedQuestionsScreen from './screens/BookmarkedQuestionsScreen';
import QuestionBankScreen from './screens/QuestionBankScreen';
import { ToastProvider } from './context/ToastContext';
import { setGamificationToastDispatcher } from './context/GamificationContext';
import { useToasts } from './context/ToastContext';
import PomodoroScreen from './screens/PomodoroScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProfessorScreen from './screens/ProfessorScreen';
import LoginScreen from './screens/LoginScreen';
import StudyPlanScreen from './screens/StudyPlanScreen';
import Loader from './components/Loader';

function AppUI() {
    const { background, focusMode } = useTheme();
    const { level } = useGamification();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const { addToast } = useToasts();
    setGamificationToastDispatcher((title, message) => addToast(message, 'success', title));
    
    const backgroundClass = background === 'default' 
        ? `level-bg level-bg-${Math.min(level, 5)}`
        : `bg-${background}`;
    
    const focusClass = focusMode ? 'focus-mode' : '';

    return (
        <div className={`min-h-screen ${backgroundClass} ${focusClass}`}>
            <div className="min-h-screen main-bg-transition">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
                <main className="container mx-auto px-4 py-8">
                    <Routes>
                        <Route path="/" element={<HomeScreen />} />
                        <Route path="/planner" element={<StudyPlanScreen />} />
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
                        <Route path="/achievements" element={<AchievementsScreen />} />
                        <Route path="/analytics" element={<AnalyticsScreen />} />
                        <Route path="/explainer" element={<ExplainerScreen />} />
                        <Route path="/diagram-explainer" element={<DiagramExplainerScreen />} />
                        <Route path="/drive" element={<GoogleDriveScreen />} />
                        <Route path="/notion" element={<NotionScreen />} />
                        <Route path="/bookmarks" element={<BookmarkedQuestionsScreen />} />
                        <Route path="/question-bank/:fileName" element={<QuestionBankScreen />} />
                        <Route path="/pomodoro" element={<PomodoroScreen />} />
                        <Route path="/profile" element={<ProfileScreen />} />
                        <Route path="/professor" element={<ProfessorScreen />} />
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

function AppCore() {
    const { state } = useAppData();
    const { isLoggedIn, isInitialized } = state.authState;

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader text="Initializing App..." />
            </div>
        );
    }
    
    if (!isLoggedIn) {
        return <LoginScreen />;
    }

    return <AppUI />;
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AppDataProvider>
          <AppCore />
        </AppDataProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
