import { useEffect, useState } from "react";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import AboutPage from "./pages/AboutPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import DetectPage from "./pages/DetectPage";
import HistoryPage from "./pages/HistoryPage";
import HomePage from "./pages/HomePage";
import { AnalysisReport, DemoUser, PageRoute } from "./types/news";
import {
  clearHistory,
  deleteReportFromHistory,
  getDemoSession,
  loadHistory,
  logoutDemoAccount,
  saveReportToHistory,
} from "./utils/storage";

export default function App() {
  const [route, setRoute] = useState<PageRoute>("home");
  const [history, setHistory] = useState<AnalysisReport[]>(() => loadHistory());
  const [activeReport, setActiveReport] = useState<AnalysisReport | null>(null);
  const [sessionUser, setSessionUser] = useState<DemoUser | null>(() =>
    getDemoSession()
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [route]);

  const handleAnalysisComplete = (report: AnalysisReport) => {
    const updated = saveReportToHistory(report);
    setHistory(updated);
    setActiveReport(report);
    setRoute("detect");
  };

  const handleDeleteReport = (id: string) => {
    const updated = deleteReportFromHistory(id);
    setHistory(updated);
    if (activeReport?.id === id) {
      setActiveReport(null);
    }
  };

  const handleClearHistory = () => {
    const updated = clearHistory();
    setHistory(updated);
    setActiveReport(null);
  };

  const handleSelectReportFromDashboard = (report: AnalysisReport) => {
    setActiveReport(report);
    setRoute("detect");
  };

  const handleAuthSuccess = (user: DemoUser) => {
    setSessionUser(user);
    setRoute(user.role === "Admin" ? "admin" : "dashboard");
  };

  const handleLogout = () => {
    logoutDemoAccount();
    setSessionUser(null);
    if (route === "admin") {
      setRoute("home");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        currentRoute={route}
        onNavigate={setRoute}
        sessionUser={sessionUser}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {route === "home" && (
          <HomePage
            onAnalysisComplete={handleAnalysisComplete}
            onNavigate={setRoute}
          />
        )}

        {route === "detect" && (
          <DetectPage
            activeReport={activeReport}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {route === "history" && (
          <HistoryPage
            history={history}
            onDeleteReport={handleDeleteReport}
            onClearHistory={handleClearHistory}
            onNavigate={setRoute}
          />
        )}

        {(route === "dashboard" || route === "admin") && (
          <DashboardPage
            key={route}
            initialMode={route === "admin" ? "admin" : "user"}
            history={history}
            sessionUser={sessionUser}
            onSelectReport={handleSelectReportFromDashboard}
            onNavigate={setRoute}
          />
        )}

        {(route === "login" || route === "register") && (
          <AuthPage
            mode={route === "register" ? "register" : "login"}
            sessionUser={sessionUser}
            onAuthSuccess={handleAuthSuccess}
            onLogout={handleLogout}
            onNavigate={setRoute}
          />
        )}

        {route === "about" && <AboutPage onNavigate={setRoute} />}
      </main>

      <Footer onNavigate={setRoute} />
    </div>
  );
}
