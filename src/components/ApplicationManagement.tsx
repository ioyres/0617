import React, { useState } from "react";
import { AdoptionApplication, ApplicationStatus, Pet, ActivityLog } from "../types";
import { dbService } from "../services/dbService";
import { useAuth } from "../context/AuthContext";
import {
  FileText,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  HelpCircle
} from "lucide-react";

interface ApplicationManagementProps {
  isFirebaseMode: boolean;
  applications: AdoptionApplication[];
  pets: Pet[];
  onRefreshData: () => void;
}

export const ApplicationManagement: React.FC<ApplicationManagementProps> = ({
  isFirebaseMode,
  applications,
  pets,
  onRefreshData
}) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("全部");

  // Selection/Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedApp, setSelectedApp] = useState<AdoptionApplication | null>(null);

  // Form Fields
  const [formFields, setFormFields] = useState({
    petId: "",
    applicantName: "",
    contactPhone: "",
    contactEmail: "",
    notes: "",
    status: "審核中" as ApplicationStatus
  });

  const handleOpenAdd = () => {
    setModalType("add");
    setSelectedApp(null);
    setFormFields({
      petId: "",
      applicantName: "",
      contactPhone: "",
      contactEmail: currentUser?.email || "",
      notes: "",
      status: "審核中"
    });
    setShowModal(true);
  };

  const handleOpenEdit = (appItem: AdoptionApplication) => {
    setModalType("edit");
    setSelectedApp(appItem);
    setFormFields({
      petId: appItem.petId,
      applicantName: appItem.applicantName,
      contactPhone: appItem.contactPhone,
      contactEmail: appItem.contactEmail,
      notes: appItem.notes,
      status: appItem.status
    });
    setShowModal(true);
  };

  const handleDelete = async (appId: string, applicantName: string, petName: string) => {
    if (!window.confirm(`確定要刪除「${applicantName}」對「${petName}」的認養申請案件紀錄嗎？`)) return;

    try {
      await dbService.deleteApplication(isFirebaseMode, appId);

      const log: ActivityLog = {
        id: `log_${Date.now()}`,
        type: "pet_delete",
        userEmail: currentUser?.email || "admin@petadopt.tw",
        detail: `刪除申請：${applicantName} 對 ${petName} 的認養審核紀錄`,
        timestamp: Date.now()
      };
      await dbService.addActivityLog(isFirebaseMode, log);

      onRefreshData();
    } catch (err) {
      alert("刪除失敗：" + err);
    }
  };

  const handleQuickStatusUpdate = async (appItem: AdoptionApplication, nextStatus: ApplicationStatus) => {
    const updatedApp: AdoptionApplication = {
      ...appItem,
      status: nextStatus
    };

    try {
      await dbService.saveApplication(isFirebaseMode, updatedApp, false);

      // If approved, we can also automatically suggest updating the pet status to '已認養'!
      if (nextStatus === "已核准") {
        const petToUpdate = pets.find((p) => p.id === appItem.petId);
        if (petToUpdate && petToUpdate.status === "待認養") {
          await dbService.savePet(isFirebaseMode, { ...petToUpdate, status: "已認養" }, false);
        }
      }

      // Save Log
      const log: ActivityLog = {
        id: `log_${Date.now()}`,
        type: "app_status_update",
        userEmail: currentUser?.email || "admin@petadopt.tw",
        detail: `將「${appItem.applicantName}」的「${appItem.petName}」認養申請狀態變更為：【${nextStatus}】`,
        timestamp: Date.now()
      };
      await dbService.addActivityLog(isFirebaseMode, log);

      onRefreshData();
    } catch (err) {
      alert("更新狀態失敗：" + err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.petId || !formFields.applicantName.trim()) {
      alert("請填寫必要的欄位資訊！");
      return;
    }

    const selectedPet = pets.find((p) => p.id === formFields.petId);
    if (!selectedPet) {
      alert("找不到選取的寵物！");
      return;
    }

    const appId = modalType === "add" ? `app_${Date.now()}` : (selectedApp?.id || "");
    const appliedAt = modalType === "add" ? Date.now() : (selectedApp?.appliedAt || Date.now());

    const finalApp: AdoptionApplication = {
      id: appId,
      petId: formFields.petId,
      petName: selectedPet.name,
      applicantName: formFields.applicantName,
      contactPhone: formFields.contactPhone,
      contactEmail: formFields.contactEmail,
      notes: formFields.notes,
      status: formFields.status,
      appliedAt
    };

    try {
      await dbService.saveApplication(isFirebaseMode, finalApp, modalType === "add");

      if (formFields.status === "已核准") {
        if (selectedPet.status === "待認養") {
          await dbService.savePet(isFirebaseMode, { ...selectedPet, status: "已認養" }, false);
        }
      }

      // Save Activity Log
      const log: ActivityLog = {
        id: `log_${Date.now()}`,
        type: modalType === "add" ? "app_add" : "app_status_update",
        userEmail: currentUser?.email || "admin@petadopt.tw",
        detail: modalType === "add"
          ? `${finalApp.applicantName} 提交對 ${finalApp.petName} 的認養申請 (手動新增)`
          : `更新了「${finalApp.applicantName}」的申請，狀態為 ${finalApp.status}`,
        timestamp: Date.now()
      };
      await dbService.addActivityLog(isFirebaseMode, log);

      setShowModal(false);
      onRefreshData();
    } catch (err) {
      alert("儲存申請變更失敗：" + err);
    }
  };

  // Filters
  const filteredApps = applications.filter((appItem) => {
    const matchesSearch = appItem.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          appItem.petName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          appItem.notes.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "全部" || appItem.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case "審核中":
        return "bg-natural-beige/35 text-natural-olive border border-natural-beige/50";
      case "已核准":
        return "bg-natural-sage/15 text-natural-sagedark border border-natural-sage/25";
      case "已拒絕":
        return "bg-rose-50 text-rose-600 border border-rose-200";
      default:
        return "bg-[#FBF9F7] text-natural-text/70";
    }
  };

  const getFormatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-natural-darkolive tracking-tight">認養申請管理</h2>
          <p className="text-xs text-natural-text/75 mt-1 font-medium">
            處理認養人提出的寵物申請案件，審核申請人聯絡電話與居住成員條件，妥善做好適養評估。
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-natural-sage hover:bg-natural-sagedark text-white font-extrabold text-xs tracking-wider rounded-xl shadow-md transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          登記新申請
        </button>
      </div>

      {/* Search & filters */}
      <div className="bg-white rounded-2xl p-4 border border-natural-border/60 card-shadow flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-text/60" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋申請人姓名、申請寵物或自我介紹備註..."
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-[#F9F7F5] border border-natural-border rounded-xl focus:bg-white focus:border-natural-sage transition-all outline-none font-medium text-natural-text"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-natural-text/70" />
            <span className="text-xs font-bold text-natural-text/70">審核進度：</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs py-2 px-3 border border-[#E5E0DA] bg-white rounded-xl focus:border-natural-sage outline-none font-bold text-natural-text cursor-pointer"
          >
            <option value="全部">全部狀態</option>
            <option value="審核中">審核中</option>
            <option value="已核准">已核准</option>
            <option value="已拒絕">已拒絕</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-16 bg-white border border-natural-border/60 rounded-3xl text-natural-text/60 card-shadow">
          <FileText className="w-12 h-12 mx-auto mb-3 text-natural-beige animate-pulse" />
          <p className="font-bold text-sm text-natural-text">目前找不到任何申請案資料</p>
          <p className="text-xs text-natural-text/50 mt-1 font-medium">您可以點按「登記新申請」或調整篩選條件。</p>
        </div>
      ) : (
        <div className="bg-white border border-natural-border/60 rounded-3xl overflow-hidden card-shadow">
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FBF9F7] border-b border-natural-border text-natural-text/75 font-bold text-xs uppercase tracking-wider">
                  <th className="py-4 px-6">申請人資訊</th>
                  <th className="py-4 px-6">選取寵物</th>
                  <th className="py-4 px-6">聯絡方式</th>
                  <th className="py-4 px-6">申請日期</th>
                  <th className="py-4 px-6">目前審核進度</th>
                  <th className="py-4 px-6 text-center">案件決定與修改</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0DA]/40 text-natural-text text-xs font-medium">
                {filteredApps.map((appItem) => (
                  <tr key={appItem.id} className="hover:bg-natural-bg/20 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-natural-darkolive text-sm">{appItem.applicantName}</div>
                      <div className="text-[11px] text-natural-text/60 mt-1 max-w-xs truncate" title={appItem.notes}>
                        備註: {appItem.notes || "無"}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-natural-sagedark">
                      <span className="flex items-center gap-1.5 font-bold">
                        🐾 {appItem.petName}
                      </span>
                    </td>
                    <td className="py-4 px-6 space-y-1 text-natural-text/80">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-natural-text/50" />
                        <span>{appItem.contactPhone}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-natural-text/50">
                        <Mail className="w-3 h-3 text-natural-text/50" />
                        <span>{appItem.contactEmail}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-natural-text/50 font-mono">
                      {getFormatDate(appItem.appliedAt)}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[10px] ${getStatusColor(
                          appItem.status
                        )}`}
                      >
                        {appItem.status === "審核中" && <Clock className="w-3.5 h-3.5 text-natural-olive" />}
                        {appItem.status === "已核准" && <CheckCircle className="w-3.5 h-3.5 text-natural-sage" />}
                        {appItem.status === "已拒絕" && <XCircle className="w-3.5 h-3.5 text-rose-500" />}
                        {appItem.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        {appItem.status === "審核中" && (
                          <>
                            <button
                              onClick={() => handleQuickStatusUpdate(appItem, "已核准")}
                              className="px-2.5 py-1.5 bg-natural-sage/10 hover:bg-natural-sage/20 text-natural-sagedark font-extrabold rounded-lg border border-natural-sage/20 transition-colors cursor-pointer"
                              title="核准申請並通知"
                            >
                              准予領養
                            </button>
                            <button
                              onClick={() => handleQuickStatusUpdate(appItem, "已拒絕")}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100/85 text-rose-700 font-extrabold rounded-lg border border-rose-200 transition-colors cursor-pointer"
                              title="拒絕對象申請"
                            >
                              婉拒
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleOpenEdit(appItem)}
                          className="p-2 text-natural-text/80 hover:text-natural-darkolive hover:bg-natural-bg rounded-lg border border-natural-border bg-white transition-colors cursor-pointer"
                          title="修改資料"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(appItem.id, appItem.applicantName, appItem.petName)}
                          className="p-2 text-natural-text/80 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-natural-border bg-white transition-colors cursor-pointer"
                          title="刪除紀錄"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view on responsive */}
          <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
            {filteredApps.map((appItem) => (
              <div key={appItem.id} className="bg-[#FBF9F7] rounded-2xl p-4 border border-natural-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-natural-text/40 font-mono">
                    申請日期: {getFormatDate(appItem.appliedAt)}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${getStatusColor(appItem.status)}`}>
                    {appItem.status}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-natural-darkolive">{appItem.applicantName}</h4>
                  <p className="text-xs font-bold text-natural-sagedark mt-1">申請寵物: 🐾 {appItem.petName}</p>
                </div>

                <div className="bg-white p-2.5 border border-[#E5E0DA]/50 rounded-xl space-y-1.5 text-[11px] text-natural-text/80">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-natural-text/40" />
                    <span>電話: {appItem.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-natural-text/40" />
                    <span>郵箱: {appItem.contactEmail}</span>
                  </div>
                  <div className="text-natural-text/60 mt-1.5 border-t border-[#E5E0DA]/30 pt-1.5">
                    備註環境: {appItem.notes || "無"}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#E5E0DA]/30">
                  {appItem.status === "審核中" && (
                    <>
                      <button
                        onClick={() => handleQuickStatusUpdate(appItem, "已核准")}
                        className="px-3 py-1 bg-natural-sage/10 text-natural-sagedark text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        准予
                      </button>
                      <button
                        onClick={() => handleQuickStatusUpdate(appItem, "已拒絕")}
                        className="px-3 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-lg cursor-pointer"
                      >
                        婉拒
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleOpenEdit(appItem)}
                    className="p-1 px-2 border border-natural-border bg-white text-natural-text/70 text-[10px] rounded-lg cursor-pointer"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(appItem.id, appItem.applicantName, appItem.petName)}
                    className="p-1 px-2 border border-natural-border bg-white text-red-500 text-[10px] rounded-lg cursor-pointer"
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- APPLICATION MODAL (ADD & EDIT) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative transform transition-all">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-650" />
                <h3 className="font-bold text-slate-800 text-md">
                  {modalType === "add" ? "登記新領養申請書" : "修改申請案件"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">認養目標寵物 *</label>
                <select
                  required
                  disabled={modalType === "edit"}
                  value={formFields.petId}
                  onChange={(e) => setFormFields({ ...formFields, petId: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                >
                  <option value="">-- 請選擇一隻待領養的浪浪 --</option>
                  {pets
                    .filter((p) => p.status === "待認養" || p.id === formFields.petId)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.type} - {p.status})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">申請人姓名 *</label>
                  <input
                    type="text"
                    required
                    value={formFields.applicantName}
                    onChange={(e) => setFormFields({ ...formFields, applicantName: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                    placeholder="請輸入姓名..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">聯絡電話 *</label>
                  <input
                    type="text"
                    required
                    value={formFields.contactPhone}
                    onChange={(e) => setFormFields({ ...formFields, contactPhone: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-250 rounded-xl"
                    placeholder="10 位數行動電話..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">聯絡信箱 *</label>
                  <input
                    type="email"
                    required
                    value={formFields.contactEmail}
                    onChange={(e) => setFormFields({ ...formFields, contactEmail: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-250 rounded-xl"
                    placeholder="example@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">審查審核狀態 *</label>
                  <select
                    value={formFields.status}
                    onChange={(e) => setFormFields({ ...formFields, status: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="審核中">審核中⏳</option>
                    <option value="已核准">已核准✅</option>
                    <option value="已拒絕">已拒絕❌</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">家庭成員與環境自傳 (飼育動機狀況敘述)</label>
                <textarea
                  rows={4}
                  required
                  value={formFields.notes}
                  onChange={(e) => setFormFields({ ...formFields, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder="寫一些關於自己的家庭配置、工作日常陪伴、飼養空間描述..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-natural-border/50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-natural-border text-natural-text/70 hover:bg-natural-bg font-bold text-xs rounded-xl cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-natural-sage hover:bg-natural-sagedark text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  確認並存檔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
