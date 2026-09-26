import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SubjectDetailPage } from "./pages/SubjectDetailPage";
import { ProfileModal } from "./components/ProfileModal";
import { FileViewerModal } from "./components/FileViewerModal";
import { api, type Resource } from "./api/client";

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register">("login");
  
  // Navigation State
  const [currentView, setCurrentView] = useState<"dashboard" | "subject">("dashboard");
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);

  // File Download handler
  const handleDownloadResource = (resource: Resource) => {
    const downloadUrl = api.resources.getDownloadUrl(resource.id);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", resource.file_name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center font-mono">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#00FF41] mb-4 shadow-[0_0_20px_rgba(0,255,65,0.2)] animate-pulse">
          <span className="w-5 h-5 border-2 border-[#00FF41] border-t-transparent rounded-full animate-spin"></span>
        </div>
        <p className="text-xs text-zinc-500 tracking-wider">INITIALIZING ACADNOTE...</p>
      </div>
    );
  }

  // Unauthenticated: Show Login or Register
  if (!user) {
    if (authView === "register") {
      return <RegisterPage onNavigateToLogin={() => setAuthView("login")} />;
    }
    return <LoginPage onNavigateToRegister={() => setAuthView("register")} />;
  }

  // Navigation handlers
  const handleOpenSubject = (subjectId: string) => {
    setActiveSubjectId(subjectId);
    setCurrentView("subject");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNavigateHome = () => {
    setActiveSubjectId(null);
    setCurrentView("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#030305] text-zinc-100 flex flex-col hacker-grid selection:bg-[#00FF41] selection:text-black">
      {/* Global Navbar */}
      <Navbar
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onNavigateHome={handleNavigateHome}
        onSelectSubject={handleOpenSubject}
        onViewResource={(res) => setViewingResource(res)}
      />

      {/* Main View */}
      <div className="flex-1 pb-16">
        {currentView === "dashboard" || !activeSubjectId ? (
          <DashboardPage
            onOpenSubject={handleOpenSubject}
            onViewResource={(res) => setViewingResource(res)}
            onDownloadResource={handleDownloadResource}
          />
        ) : (
          <SubjectDetailPage
            subjectId={activeSubjectId}
            onBackToDashboard={handleNavigateHome}
            onViewResource={(res) => setViewingResource(res)}
            onDownloadResource={handleDownloadResource}
          />
        )}
      </div>

      {/* Global Modals */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      <FileViewerModal
        isOpen={!!viewingResource}
        resource={viewingResource}
        onClose={() => setViewingResource(null)}
        onDownload={handleDownloadResource}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
