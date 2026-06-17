import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Sidebar } from "./components/Sidebar";
import { DashboardHome } from "./components/DashboardHome";
import { PetManagement } from "./components/PetManagement";
import { ApplicationManagement } from "./components/ApplicationManagement";
import { MemberManagement } from "./components/MemberManagement";
import { ProfileSettings } from "./components/ProfileSettings";
import { LoginRegister } from "./components/LoginRegister";
import { dbService } from "./services/dbService";
import { Pet, AdoptionApplication } from "./types";
import { Menu, PawPrint, Database, UserCheck, ShieldCheck } from "lucide-react";

const PortalContent: React.FC = () => {
  const { currentUser, loading, isFirebaseMode, toggleFirebaseMode } = useAuth();
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  // States with centralized reactive data caching
  const [pets, setPets] = useState<Pet[]>([]);
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchCentralData = async () => {
    try {
      const allPets = await dbService.getPets(isFirebaseMode);
      setPets(allPets);

      const allApps = await dbService.getApplications(isFirebaseMode);
      setApplications(allApps);
    } catch (e) {
      console.error("Centralized reactive load failed:", e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchCentralData();
    }
  }, [currentUser, isFirebaseMode, refreshTrigger]);

  const handleRefreshData = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const navigateToTab = (tabId: string) => {
    setCurrentTab(tabId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-semibold tracking-wide">
            正在安全核備認養儲存庫狀態，請稍候...
          </p>
        </div>
      </div>
    );
  }

  // Not signed in -> show Login Gate
  if (!currentUser) {
    return <LoginRegister />;
  }

  // Main Dashboard Panel Render Router
  const renderActiveTab = () => {
    switch (currentTab) {
      case "dashboard":
        return (
          <DashboardHome
            isFirebaseMode={isFirebaseMode}
            onNavigate={navigateToTab}
            onRefreshData={handleRefreshData}
            pets={pets}
            applications={applications}
          />
        );
      case "pets":
        return (
          <PetManagement
            isFirebaseMode={isFirebaseMode}
            pets={pets}
            onRefreshData={handleRefreshData}
          />
        );
      case "applications":
        return (
          <ApplicationManagement
            isFirebaseMode={isFirebaseMode}
            applications={applications}
            pets={pets}
            onRefreshData={handleRefreshData}
          />
        );
      case "members":
        return (
          <MemberManagement
            isFirebaseMode={isFirebaseMode}
            onRefreshData={handleRefreshData}
          />
        );
      case "profile":
        return (
          <ProfileSettings
            isFirebaseMode={isFirebaseMode}
            onRefreshData={handleRefreshData}
          />
        );
      default:
        return (
          <DashboardHome
            isFirebaseMode={isFirebaseMode}
            onNavigate={navigateToTab}
            onRefreshData={handleRefreshData}
            pets={pets}
            applications={applications}
          />
        );
    }
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case "dashboard":
        return "儀表板專區";
      case "pets":
        return "寵物上架管理";
      case "applications":
        return "認養申請維護審查";
      case "members":
        return "系統會員紀錄日誌";
      case "profile":
        return "個人自傳資料設定";
      default:
        return "寵物認養管理系統";
    }
  };

  return (
    <div className="min-h-screen bg-natural-bg flex flex-col md:flex-row text-natural-text font-sans">
      {/* Sidebar navigation component */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Primary Layout Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        {/* Top Floating Appbar Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-natural-border px-6 py-4 flex items-center justify-between shadow-sm backdrop-blur-sm bg-white/95">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-natural-text hover:text-black hover:bg-natural-bg rounded-xl border border-natural-border transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-[10px] bg-natural-sage/10 text-natural-sagedark border border-natural-sage/20 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 w-max">
                <ShieldCheck className="w-3.5 h-3.5" />
                繁體中文主控台
              </span>
              <h2 className="text-sm font-extrabold text-natural-darkolive mt-0.5 tracking-tight">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick indicators status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#F9F7F5] border border-natural-border rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-natural-sage animate-pulse" />
              <span className="text-[#5A5A40] font-semibold font-mono text-[11px] select-none">
                {isFirebaseMode ? "🔌 連線中 [Firestore]" : "💾 離機中 [LocalStorage]"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-natural-text leading-normal">
                  {currentUser.displayName}
                </p>
                <p className="text-[9px] text-[#A39171] font-mono font-semibold">
                  角色權限: {currentUser.role}
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-natural-beige text-natural-darkolive flex items-center justify-center font-extrabold text-xs shadow-sm border border-natural-border/60">
                {currentUser.displayName.substring(0, 1).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Panel */}
        <main className="flex-grow p-6 md:p-8 max-w-7xl w-full mx-auto">
          {renderActiveTab()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <PortalContent />
    </AuthProvider>
  );
}
