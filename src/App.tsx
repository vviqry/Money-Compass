import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@/store/AppContext';
import { AppShell } from '@/components/layout/AppShell';

// Lazy-loaded pages for code splitting
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const IncomePage = lazy(() => import('@/pages/IncomePage'));
const ExpensePage = lazy(() => import('@/pages/ExpensePage'));
const StatisticsPage = lazy(() => import('@/pages/StatisticsPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route
              index
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <DashboardPage />
                </Suspense>
              }
            />
            <Route
              path="income"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <IncomePage />
                </Suspense>
              }
            />
            <Route
              path="expense"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <ExpensePage />
                </Suspense>
              }
            />
            <Route
              path="statistics"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <StatisticsPage />
                </Suspense>
              }
            />
            <Route
              path="calendar"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <CalendarPage />
                </Suspense>
              }
            />
            <Route
              path="settings"
              element={
                <Suspense fallback={<LoadingFallback />}>
                  <SettingsPage />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
