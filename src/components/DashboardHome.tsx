import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { dbService } from "../services/dbService";
import { Pet, AdoptionApplication, ActivityLog, SystemStats } from "../types";
import { motion } from "motion/react";
import {
  Heart,
  FileCheck2,
  Users,
  Clock,
  PlusCircle,
  FileSignature,
  FilePlus,
  ShieldEllipsis,
  PawPrint,
  TrendingUp,
  History,
  AlertTriangle,
  BadgeAlert,
  ChevronRight
} from "lucide-react";

interface DashboardHomeProps {
  isFirebaseMode: boolean;
  onNavigate: (tabId: string) => void;
  onRefreshData: () => void;
  pets: Pet[];
  applications: AdoptionApplication[];
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  isFirebaseMode,
  onNavigate,
  onRefreshData,
  pets,
  applications
}) => {
  const { currentUser, errorMsg } = useAuth();
  const [stats, setStats] = useState<SystemStats>({
    pendingPetsCount: 0,
    adoptionApplicationsCount: 0,
    adoptedPetsCount: 0,
    membersCount: 0,
  });
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal states
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showAddAppModal, setShowAddAppModal] = useState(false);

  // Form states for Quick Add Pet
  const [petForm, setPetForm] = useState({
    name: "",
    type: "狗狗",
    age: 1,
    ageUnit: "歲" as "歲" | "個月",
    gender: "公" as "公" | "母" | "未知",
    description: "",
    imageUrl: ""
  });

  // Form states for Quick Application
  const [appForm, setAppForm] = useState({
    petId: "",
    applicantName: "",
    contactPhone: "",
    contactEmail: "",
    notes: ""
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const systemStats = await dbService.getStats(isFirebaseMode);
      setStats(systemStats);

      const logs = await dbService.getActivityLogs(isFirebaseMode);
      setRecentLogs(logs.slice(0, 6)); // Display top 6 logs
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isFirebaseMode, pets, applications]);

  // Handle Quick Add Pet Submission
  const handleAddPetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petForm.name.trim()) return;

    const newPet: Pet = {
      id: `pet_${Date.now()}`,
      name: petForm.name,
      type: petForm.type,
      age: Number(petForm.age),
      ageUnit: petForm.ageUnit,
      gender: petForm.gender,
      status: "待認養",
      description: petForm.description || "這隻小可愛目前也在尋找溫暖的家喔！",
      imageUrl: petForm.imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600",
      createdAt: Date.now()
    };

    try {
      await dbService.savePet(isFirebaseMode, newPet, true);

      // Create log
      const log: ActivityLog = {
        id: `log_${Date.now()}`,
        type: "pet_add",
        userEmail: currentUser?.email || "system@petadopt.tw",
        detail: `新增寵物資料：${newPet.name} (${newPet.type})`,
        timestamp: Date.now()
      };
      await dbService.addActivityLog(isFirebaseMode, log);

      setShowAddPetModal(false);
      setPetForm({
        name: "",
        type: "狗狗",
        age: 1,
        ageUnit: "歲",
        gender: "公",
        description: "",
        imageUrl: ""
      });
      onRefreshData();
      loadDashboardData();
    } catch (err) {
      alert("儲存寵物失敗，請檢查權限或改為本地模式：" + err);
    }
  };

  // Handle Quick App Submission
  const handleAddAppSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.petId || !appForm.applicantName.trim()) {
      alert("請選擇寵物及填寫申請人姓名");
      return;
    }

    const selectedPet = pets.find((p) => p.id === appForm.petId);
    if (!selectedPet) return;

    const newApp: AdoptionApplication = {
      id: `app_${Date.now()}`,
      petId: appForm.petId,
      petName: selectedPet.name,
      applicantName: appForm.applicantName,
      contactPhone: appForm.contactPhone || "0900-000000",
      contactEmail: appForm.contactEmail || currentUser?.email || "guest@example.com",
      notes: appForm.notes || "希望能有機會領養！",
      status: "審核中",
      appliedAt: Date.now()
    };

    try {
      await dbService.saveApplication(isFirebaseMode, newApp, true);

      // Save Log
      const log: ActivityLog = {
        id: `log_${Date.now()}`,
        type: "app_add",
        userEmail: currentUser?.email || appForm.contactEmail || "guest@example.com",
        detail: `${newApp.applicantName} 提交了對 ${newApp.petName} 的認養審核申請`,
        timestamp: Date.now()
      };
      await dbService.addActivityLog(isFirebaseMode, log);

      setShowAddAppModal(false);
      setAppForm({
        petId: "",
        applicantName: "",
        contactPhone: "",
        contactEmail: "",
        notes: ""
      });
      onRefreshData();
      loadDashboardData();
    } catch (err) {
      alert("儲存申請失敗，請確認 Firebase 設定或改用本地模式！" + err);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case "pet_add":
        return <PlusCircle className="w-5 h-5 text-emerald-500" />;
      case "app_add":
        return <FilePlus className="w-5 h-5 text-indigo-500" />;
      case "app_status_update":
        return <FileCheck2 className="w-5 h-5 text-amber-500" />;
      case "user_register":
        return <Users className="w-5 h-5 text-blue-500" />;
      default:
        return <History className="w-5 h-5 text-slate-400" />;
    }
  };

  const getLogBg = (type: string) => {
    switch (type) {
      case "pet_add":
        return "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400";
      case "app_add":
        return "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400";
      case "app_status_update":
        return "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400";
      case "user_register":
        return "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400";
      default:
        return "bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400";
    }
  };

  const formattedTime = (timestamp: number) => {
    const rDate = new Date(timestamp);
    return `${rDate.getMonth() + 1}/${rDate.getDate()} ${rDate.getHours().toString().padStart(2, "0")}:${rDate.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8" id="dashboard-container">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-natural-sage to-natural-sagedark rounded-3xl p-6 md:p-8 text-white card-shadow">
        <div className="absolute top-0 right-0 transform translate-x-20 -translate-y-20 w-80 h-80 bg-white/5 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-1/4 transform translate-y-24 w-60 h-60 bg-natural-beige/10 rounded-full blur-xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-block bg-white/10 hover:bg-white/15 transition-all text-xs font-bold tracking-wider px-3 py-1 rounded-full border border-white/10">
              台灣領養浪浪平台 • 整合主控台
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              哈囉，{currentUser?.displayName || "管理者"}
            </h2>
            <p className="text-white/90 text-xs md:text-sm max-w-xl leading-relaxed">
              歡迎使用寵物認養管理後台。我們相信每一個生命都值得一個承諾，今天在這裡也有許多浪浪期待著跟您一同開啟新的生活！
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowAddPetModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-natural-beige hover:bg-white text-natural-darkolive font-extrabold text-xs tracking-wider rounded-xl shadow-md transition-all duration-200 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-natural-olive" />
              快速新增寵物
            </button>
            <button
              onClick={() => setShowAddAppModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs tracking-wider rounded-xl border border-white/20 shadow-md transition-all duration-200 cursor-pointer"
            >
              <FileSignature className="w-4 h-4 text-natural-beige" />
              快速認養申請
            </button>
          </div>
        </div>
      </div>

      {/* Error Message if offline / permission issue */}
      {errorMsg && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-800">
          <BadgeAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 animate-pulse" />
          <div>
            <h4 className="font-bold text-sm">資料存取提示</h4>
            <p className="text-xs mt-1 text-amber-700 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Stats Counter Section (Bento Grid Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "待認養寵物",
            value: stats.pendingPetsCount,
            suffix: "隻",
            description: "等待溫暖擁抱中",
            icon: PawPrint,
            colorClass: "text-natural-sage",
            bgLight: "bg-natural-sage/15",
            borderClass: "border-l-4 border-natural-sage"
          },
          {
            title: "認養申請總數",
            value: stats.adoptionApplicationsCount,
            suffix: "件",
            description: "正在審理核備",
            icon: FileCheck2,
            colorClass: "text-[#A39171]",
            bgLight: "bg-natural-beige/45",
            borderClass: "border-l-4 border-natural-beige"
          },
          {
            title: "已幸福落腳",
            value: stats.adoptedPetsCount,
            suffix: "隻",
            description: "順利尋得新家庭",
            icon: Heart,
            colorClass: "text-natural-olive",
            bgLight: "bg-natural-olive/15",
            borderClass: "border-l-4 border-natural-olive"
          },
          {
            title: "系統總會員數",
            value: stats.membersCount,
            suffix: "位",
            description: "愛心串聯力量",
            icon: Users,
            colorClass: "text-natural-sage",
            bgLight: "bg-natural-sage/15",
            borderClass: "border-l-4 border-natural-sage"
          },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={card.title}
              className={`bg-white rounded-2xl p-5 border border-natural-border/60 ${card.borderClass} card-shadow flex flex-col justify-between hover:shadow-md transition-shadow group`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-natural-text/75">{card.title}</span>
                <div className={`p-2 rounded-xl ${card.bgLight} transition-colors group-hover:scale-110 duration-200`}>
                  <Icon className={`w-4 h-4 ${card.colorClass}`} />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl md:text-3xl font-extrabold text-natural-darkolive tracking-tight">
                    {loading ? "..." : card.value}
                  </span>
                  <span className="text-[10px] font-bold text-natural-text/60">{card.suffix}</span>
                </div>
                <p className="text-[10px] text-natural-text/50 mt-1 flex items-center gap-1 font-medium">
                  <TrendingUp className="w-3 h-3 text-natural-sage" />
                  {card.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activities list */}
        <div className="lg:col-span-3 bg-white border border-natural-border/60 rounded-3xl p-6 card-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-natural-border/50">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-natural-sage/10 text-natural-sagedark rounded-lg">
                  <History className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-natural-darkolive text-xs tracking-wider">最新活動日誌</h3>
              </div>
              <button
                onClick={loadDashboardData}
                className="text-xs font-bold text-natural-sage hover:text-natural-sagedark transition-colors cursor-pointer"
              >
                刷新動態
              </button>
            </div>

            {loading ? (
              <div className="space-y-4 py-10">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex gap-4 items-center animate-pulse">
                    <div className="w-10 h-10 bg-natural-bg rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-natural-bg rounded w-2/3" />
                      <div className="h-3 bg-natural-bg rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentLogs.length === 0 ? (
              <div className="text-center py-12 text-natural-text/60 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 text-natural-beige" />
                目前尚未有任何活動日誌。
              </div>
            ) : (
              <div className="divide-y divide-natural-border/40 space-y-4 max-h-[380px] overflow-y-auto">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 pt-4 first:pt-0 items-start">
                    <div className={`p-2.5 rounded-xl ${getLogBg(log.type)} flex-shrink-0`}>
                      {getLogIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-natural-text leading-relaxed">{log.detail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-natural-text/60 font-mono font-medium">{log.userEmail}</span>
                        <span className="text-natural-border">•</span>
                        <span className="text-[10px] text-natural-text/60 font-medium">{formattedTime(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Operation Panel & System Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Shortcuts */}
          <div className="bg-white border border-natural-border/60 rounded-3xl p-6 card-shadow">
            <h3 className="font-extrabold text-[#5A5A40] text-xs tracking-wider mb-4">系統快捷功能</h3>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => onNavigate("pets")}
                className="flex items-center justify-between p-3.5 bg-[#FBF9F7] hover:bg-natural-bg active:bg-natural-beige/10 transition-colors rounded-2xl group text-left cursor-pointer border border-[#E5E0DA]/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-natural-sage/10 rounded-xl group-hover:bg-natural-sage/20 text-natural-sagedark transition-colors">
                    <PawPrint className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-natural-text">寵物名單與篩選</h4>
                    <p className="text-[10px] text-natural-text/60 mt-0.5 font-medium">查看已登記、待收養的寵物</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-natural-text/40 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onNavigate("applications")}
                className="flex items-center justify-between p-3.5 bg-[#FBF9F7] hover:bg-natural-bg active:bg-natural-beige/10 transition-colors rounded-2xl group text-left cursor-pointer border border-[#E5E0DA]/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-natural-beige/30 rounded-xl group-hover:bg-natural-beige/55 text-natural-olive transition-colors">
                    <FileSignature className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-natural-text">申請案件進度審核</h4>
                    <p className="text-[10px] text-natural-text/60 mt-0.5 font-medium">審核並核准會員發出的認養書</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-natural-text/40 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onNavigate("profile")}
                className="flex items-center justify-between p-3.5 bg-[#FBF9F7] hover:bg-natural-bg active:bg-natural-beige/10 transition-colors rounded-2xl group text-left cursor-pointer border border-[#E5E0DA]/30"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-natural-olive/10 rounded-xl group-hover:bg-natural-olive/20 text-natural-olive transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-natural-text">維護個人資料</h4>
                    <p className="text-[10px] text-natural-text/60 mt-0.5 font-medium">編輯姓名、聯絡資訊與自傳</p>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-natural-text/40 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>

          {/* Quick Notice Card */}
          <div className="bg-natural-darkolive border border-[#4A4A30] rounded-3xl p-6 text-white overflow-hidden relative card-shadow">
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-tr from-natural-beige/10 to-transparent rounded-full blur-lg" />
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-white/10 border border-white/15 rounded-xl text-natural-beige flex-shrink-0 animate-pulse">
                <ShieldEllipsis className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-xs text-white">認養手續叮嚀</h4>
                <p className="text-[11px] text-white/80 leading-relaxed font-medium">
                  系統管理與領養程序之審核非常嚴謹，核准前煩請撥打申請人之聯絡電話，親臨預約現場確認適養評估，守護每一份微小而珍貴的心意。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL: QUICK ADD PET --- */}
      {showAddPetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative transform transition-all">
            {/* Title */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-md">快速新增認養寵物</h3>
              </div>
              <button
                onClick={() => setShowAddPetModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddPetSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">寵物姓名 *</label>
                  <input
                    type="text"
                    required
                    value={petForm.name}
                    onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="例如：茶茶"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">種類 *</label>
                  <select
                    value={petForm.type}
                    onChange={(e) => setPetForm({ ...petForm, type: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:border-indigo-500"
                  >
                    <option value="狗狗">狗狗</option>
                    <option value="貓咪">貓咪</option>
                    <option value="其他">其他 / 兔子 / 鳥</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">年齡數字 *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={petForm.age}
                    onChange={(e) => setPetForm({ ...petForm, age: parseInt(e.target.value) || 0 })}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">時間單位 *</label>
                  <select
                    value={petForm.ageUnit}
                    onChange={(e) => setPetForm({ ...petForm, ageUnit: e.target.value as any })}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="歲">歲</option>
                    <option value="個月">個月</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">性別 *</label>
                  <select
                    value={petForm.gender}
                    onChange={(e) => setPetForm({ ...petForm, gender: e.target.value as any })}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="公">公 (男生)</option>
                    <option value="母">母 (女生)</option>
                    <option value="未知">未知</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">照片網址 (選填)</label>
                <input
                  type="url"
                  value={petForm.imageUrl}
                  onChange={(e) => setPetForm({ ...petForm, imageUrl: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                  placeholder="可使用 Unsplash 或照片網址"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">寵物描述 / 特徵敘述</label>
                <textarea
                  rows={3}
                  value={petForm.description}
                  onChange={(e) => setPetForm({ ...petForm, description: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                  placeholder="例如：個性親人、溫和、不會吠叫，期待找到幸福港灣..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPetModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold text-xs rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-md"
                >
                  儲存並上架
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: QUICK ADOPTION APPLICATION --- */}
      {showAddAppModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative transform transition-all">
            {/* Title */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800 text-md">快速填寫認養申請書</h3>
              </div>
              <button
                onClick={() => setShowAddAppModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddAppSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">選擇心儀的寵物 *</label>
                <select
                  required
                  value={appForm.petId}
                  onChange={(e) => setAppForm({ ...appForm, petId: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-xl focus:border-indigo-500"
                >
                  <option value="">-- 請選擇待認養的浪浪 --</option>
                  {pets
                    .filter((p) => p.status === "待認養")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.type} / {p.age} {p.ageUnit})
                      </option>
                    ))}
                </select>
                {pets.filter((p) => p.status === "待認養").length === 0 && (
                  <p className="text-[10px] text-rose-500 mt-1">目前沒有待認養的浪浪供申請，請先新增寵物！</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">申請人姓名 *</label>
                  <input
                    type="text"
                    required
                    value={appForm.applicantName}
                    onChange={(e) => setAppForm({ ...appForm, applicantName: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl"
                    placeholder="林大仁"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">聯絡電話 *</label>
                  <input
                    type="text"
                    required
                    value={appForm.contactPhone}
                    onChange={(e) => setAppForm({ ...appForm, contactPhone: e.target.value })}
                    className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl"
                    placeholder="0911-222333"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">聯絡信箱 *</label>
                <input
                  type="email"
                  required
                  value={appForm.contactEmail}
                  onChange={(e) => setAppForm({ ...appForm, contactEmail: e.target.value })}
                  className="w-full text-sm px-3.5 py-2 border border-slate-200 rounded-xl"
                  placeholder="daren@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">認養評估備註 / 環境陳述</label>
                <textarea
                  rows={3}
                  value={appForm.notes}
                  onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })}
                  className="w-full text-xs px-3.5 py-2 border border-slate-200 rounded-xl"
                  placeholder="請在此簡短陳述您的家中成員規劃、飼養經驗與每天可陪伴寵物時間..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAppModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold text-xs rounded-xl"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={pets.filter((p) => p.status === "待認養").length === 0}
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-md"
                >
                  送出申請審查
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
