import React from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  PawPrint,
  FileText,
  Users,
  User,
  LogOut,
  Database,
  CloudLightning,
  ChevronRight,
  Menu,
  X
} from "lucide-react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileOpen,
  setMobileOpen
}) => {
  const { currentUser, signOutUser, isFirebaseMode, toggleFirebaseMode } = useAuth();

  const menuItems = [
    { id: "dashboard", label: "儀表板首頁", icon: LayoutDashboard },
    { id: "pets", label: "寵物資料管理", icon: PawPrint },
    { id: "applications", label: "認養申請維護", icon: FileText },
    { id: "members", label: "會員與活動日誌", icon: Users },
    { id: "profile", label: "個人資料設定", icon: User },
  ];

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setMobileOpen(false);
  };

  const getInitials = (name: string) => {
    return name ? name.substring(0, 1).toUpperCase() : "U";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-natural-sage text-white">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-natural-sage font-bold text-xl shadow-sm">
            🐾
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wider text-white">寵愛家園</h1>
            <p className="text-[10px] text-white/70 font-medium tracking-widest uppercase">Pet Home Console</p>
          </div>
        </div>
        <button
          className="md:hidden text-white/80 hover:text-white"
          onClick={() => setMobileOpen(false)}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Mode Switcher Banner */}
      <div className="px-4 py-3 mx-4 my-4 bg-natural-sagedark/60 rounded-xl border border-white/10 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-natural-beige" />
            <span className="text-[11px] font-bold text-white/90">儲存資料庫狀態</span>
          </div>
          <span
            className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
              isFirebaseMode
                ? "bg-natural-beige text-natural-darkolive border border-white/15"
                : "bg-white/10 text-white/85 border border-white/10"
            }`}
          >
            {isFirebaseMode ? "Firebase" : "LocalStorage"}
          </span>
        </div>

        <button
          onClick={toggleFirebaseMode}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg text-[11px] font-bold transition-all bg-white/10 hover:bg-white/15 active:bg-white/20 border border-white/15 text-white"
        >
          <CloudLightning className="w-3.5 h-3.5 text-natural-beige" />
          切換為 {isFirebaseMode ? "本地模式" : "Firebase 模式"}
        </button>
        <p className="text-[9px] text-white/70 mt-1.5 text-center leading-relaxed">
          {isFirebaseMode
            ? "已串接專屬 Firestore 雲端資料庫"
            : "本機快取模式中，免登入、免打字"}
        </p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all font-bold text-xs group ${
                isActive
                  ? "bg-white/20 text-white border-l-4 border-natural-bg"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`} />
                <span>{item.label}</span>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isActive ? "translate-x-0 opacity-100" : "translate-x-[-4px] opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* User Information & Log out footer */}
      {currentUser && (
        <div className="p-4 border-t border-white/10 bg-natural-sagedark/40">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-natural-beige text-natural-darkolive border border-white/20 flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
              {getInitials(currentUser.displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate leading-normal">{currentUser.displayName}</p>
              <p className="text-[10px] text-white/70 truncate">{currentUser.email}</p>
              <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-white/90">
                {currentUser.role}
              </span>
            </div>
          </div>
          <button
            onClick={signOutUser}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold bg-[#5E8B5E] hover:bg-[#4E734E] text-white border border-white/10 shadow-sm transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>登出系統</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:block w-64 h-screen flex-shrink-0 border-r border-[#E5E0DA]">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer (visible on mobile menu trigger) */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 md:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 blur-sm" onClick={() => setMobileOpen(false)} />

        {/* Swipe Menu Container */}
        <div
          className={`absolute inset-y-0 left-0 w-64 max-w-xs transition-transform duration-300 transform ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent />
        </div>
      </div>
    </>
  );
};
