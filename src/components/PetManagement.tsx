import React, { useState } from "react";
import { Pet, PetStatus, ActivityLog } from "../types";
import { dbService } from "../services/dbService";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  PawPrint,
  Heart,
  Undo2,
  AlertCircle
} from "lucide-react";

interface PetManagementProps {
  isFirebaseMode: boolean;
  pets: Pet[];
  onRefreshData: () => void;
}

export const PetManagement: React.FC<PetManagementProps> = ({
  isFirebaseMode,
  pets,
  onRefreshData
}) => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");

  // Selection/Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit">("add");
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);

  // Form Fields
  const [formFields, setFormFields] = useState({
    name: "",
    type: "狗狗",
    age: 1,
    ageUnit: "歲" as "歲" | "個月",
    gender: "公" as "公" | "母" | "未知",
    status: "待認養" as PetStatus,
    description: "",
    imageUrl: ""
  });

  const handleOpenAdd = () => {
    setModalType("add");
    setSelectedPet(null);
    setFormFields({
      name: "",
      type: "狗狗",
      age: 1,
      ageUnit: "歲",
      gender: "公",
      status: "待認養",
      description: "",
      imageUrl: ""
    });
    setShowModal(true);
  };

  const handleOpenEdit = (pet: Pet) => {
    setModalType("edit");
    setSelectedPet(pet);
    setFormFields({
      name: pet.name,
      type: pet.type,
      age: pet.age,
      ageUnit: pet.ageUnit,
      gender: pet.gender,
      status: pet.status,
      description: pet.description,
      imageUrl: pet.imageUrl || ""
    });
    setShowModal(true);
  };

  const handleDelete = async (petId: string, petName: string) => {
    if (!window.confirm(`確定要刪除「${petName}」的所有建檔資料嗎？此操作無法還原。`)) return;

    try {
      await dbService.deletePet(isFirebaseMode, petId);

      // Save Log
      const log: ActivityLog = {
        id: `log_${Date.now()}`,
        type: "pet_delete",
        userEmail: currentUser?.email || "admin@petadopt.tw",
        detail: `刪除寵物資料欄位：${petName}`,
        timestamp: Date.now()
      };
      await dbService.addActivityLog(isFirebaseMode, log);

      onRefreshData();
    } catch (err) {
      alert("刪除失敗：" + err);
    }
  };

  const handleToggleStatus = async (pet: Pet) => {
    const nextStatus: PetStatus = pet.status === "待認養" ? "已認養" : "待認養";
    const phrase = nextStatus === "已認養" ? "已被幸福收養囉！" : "重新回到待收養狀態";

    const updatedPet: Pet = {
      ...pet,
      status: nextStatus
    };

    try {
      await dbService.savePet(isFirebaseMode, updatedPet, false);

      // Create log
      const log: ActivityLog = {
        id: `log_${Date.now()}`,
        type: "app_status_update",
        userEmail: currentUser?.email || "admin@petadopt.tw",
        detail: `更新寵物「${pet.name}」狀態為：${nextStatus} (${phrase})`,
        timestamp: Date.now()
      };
      await dbService.addActivityLog(isFirebaseMode, log);

      onRefreshData();
    } catch (err) {
      alert("更改狀態失敗：" + err);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFields.name.trim()) {
      alert("請填寫寵物姓名！");
      return;
    }

    const petId = modalType === "add" ? `pet_${Date.now()}` : (selectedPet?.id || "");
    const createdAt = modalType === "add" ? Date.now() : (selectedPet?.createdAt || Date.now());

    const finalPet: Pet = {
      id: petId,
      name: formFields.name,
      type: formFields.type,
      age: Number(formFields.age),
      ageUnit: formFields.ageUnit,
      gender: formFields.gender,
      status: formFields.status,
      description: formFields.description || "可愛溫柔的小動物，等待合適的主人中。",
      imageUrl: formFields.imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600",
      createdAt
    };

    try {
      await dbService.savePet(isFirebaseMode, finalPet, modalType === "add");

      // Save Activity Log
      const log: ActivityLog = {
        id: `log_${Date.now()}`,
        type: modalType === "add" ? "pet_add" : "app_status_update",
        userEmail: currentUser?.email || "admin@petadopt.tw",
        detail: modalType === "add"
          ? `新增寵物資料：${finalPet.name} (${finalPet.type})`
          : `編輯寵物基本欄位：${finalPet.name}`,
        timestamp: Date.now()
      };
      await dbService.addActivityLog(isFirebaseMode, log);

      setShowModal(false);
      onRefreshData();
    } catch (err) {
      alert("儲存寵物失敗，請檢查您的權限設定！" + err);
    }
  };

  // Filtering Logic
  const filteredPets = pets.filter((pet) => {
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          pet.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "全部" || pet.type === typeFilter;
    const matchesStatus = statusFilter === "全部" || pet.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getFormatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}`;
  };
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-natural-darkolive tracking-tight">寵物資料管理</h2>
          <p className="text-xs text-natural-text/75 mt-1 font-medium">
            在這裡維護與管理可供認養的毛孩基本檔案，包括上架新寵物、編輯狀態或進行歷史刪除。
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-natural-sage hover:bg-natural-sagedark text-white font-extrabold text-xs tracking-wider rounded-xl shadow-md transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          上架新寵物
        </button>
      </div>

      {/* Filters card */}
      <div className="bg-white rounded-2xl p-4 border border-natural-border/60 card-shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-text/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜尋寵物名稱、關鍵字特徵描述..."
              className="w-full text-xs pl-10 pr-4 py-2.5 bg-[#F9F7F5] border border-natural-border rounded-xl focus:bg-white focus:border-natural-sage transition-all outline-none font-medium text-natural-text"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-natural-text/70" />
              <span className="text-xs font-bold text-natural-text/70">分類：</span>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs py-2 px-3 border border-[#E5E0DA] bg-white rounded-xl focus:border-natural-sage outline-none font-bold text-natural-text cursor-pointer"
            >
              <option value="全部">全部種類</option>
              <option value="狗狗">狗狗 🐶</option>
              <option value="貓咪">貓咪 🐱</option>
              <option value="其他">其他小動物 🐰</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs py-2 px-3 border border-[#E5E0DA] bg-white rounded-xl focus:border-natural-sage outline-none font-bold text-natural-text cursor-pointer"
            >
              <option value="全部">全部狀態</option>
              <option value="待認養">待認養</option>
              <option value="已認養">已認養</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid or Table list */}
      {filteredPets.length === 0 ? (
        <div className="text-center py-16 bg-white border border-natural-border/60 rounded-3xl text-natural-text/60 card-shadow">
          <PawPrint className="w-12 h-12 mx-auto mb-3 text-natural-beige animate-pulse" />
          <p className="font-bold text-sm text-natural-text">找不到符合條件的寵物資訊</p>
          <p className="text-xs text-natural-text/50 mt-1 font-medium">您可以點按右上角「上架新寵物」或者重設關鍵字篩選條件噢！</p>
        </div>
      ) : (
        <div className="bg-white border border-natural-border/60 rounded-3xl overflow-hidden card-shadow">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FBF9F7] border-b border-natural-border text-natural-text/75 font-bold text-xs uppercase tracking-wider">
                  <th className="py-4 px-6">寵物照片</th>
                  <th className="py-4 px-6">名稱與種類</th>
                  <th className="py-4 px-6">年齡與性別</th>
                  <th className="py-4 px-6">目前的認養狀態</th>
                  <th className="py-4 px-6">建立上架日期</th>
                  <th className="py-4 px-6 text-center">後台操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0DA]/40 text-natural-text text-xs font-medium">
                {filteredPets.map((pet) => (
                  <tr key={pet.id} className="hover:bg-natural-bg/20 transition-colors">
                    <td className="py-3 px-6">
                      <img
                        referrerPolicy="no-referrer"
                        src={pet.imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400"}
                        alt={pet.name}
                        className="w-12 h-12 rounded-xl object-cover border border-natural-border/50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400";
                        }}
                      />
                    </td>
                    <td className="py-3 px-6">
                      <div>
                        <div className="font-bold text-sm text-natural-darkolive">{pet.name}</div>
                        <span className="inline-block mt-1 text-[10px] font-bold bg-natural-sage/10 px-2 py-0.5 rounded text-natural-sagedark">
                          {pet.type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="font-bold text-natural-text">{pet.age} {pet.ageUnit}</div>
                      <span className="text-natural-text/60 mt-0.5 text-[11px] block">性別: {pet.gender}</span>
                    </td>
                    <td className="py-3 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-[10px] ${
                          pet.status === "待認養"
                            ? "bg-natural-beige/30 text-natural-olive border border-natural-beige/50"
                            : "bg-natural-sage/15 text-natural-sagedark border border-natural-sage/25"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${pet.status === "待認養" ? "bg-natural-olive" : "bg-natural-sage"}`} />
                        {pet.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-natural-text/50 font-mono">
                      {getFormatDate(pet.createdAt)}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(pet)}
                          title={pet.status === "待認養" ? "标记為已認養" : "標記為待認養"}
                          className={`p-2 rounded-lg border transition-all cursor-pointer ${
                            pet.status === "待認養"
                              ? "bg-natural-sage/10 text-natural-sagedark border-natural-sage/20 hover:bg-natural-sage/20"
                              : "bg-[#FBF9F7] text-natural-text/70 border-natural-border hover:bg-natural-bg"
                          }`}
                        >
                          {pet.status === "待認養" ? <Heart className="w-4 h-4 fill-natural-sage stroke-natural-sage" /> : <Undo2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(pet)}
                          className="p-2 text-natural-text/80 hover:text-natural-darkolive hover:bg-natural-bg rounded-lg border border-natural-border bg-white transition-colors cursor-pointer"
                          title="編輯寵物"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pet.id, pet.name)}
                          className="p-2 text-natural-text/80 hover:text-red-600 hover:bg-red-50 rounded-lg border border-natural-border bg-white transition-colors cursor-pointer"
                          title="刪除上架"
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

          {/* Mobile Grid Card View (shows on small screen) */}
          <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
            {filteredPets.map((pet) => (
              <div key={pet.id} className="bg-[#FBF9F7] rounded-2xl p-4 border border-natural-border space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    referrerPolicy="no-referrer"
                    src={pet.imageUrl || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400"}
                    alt={pet.name}
                    className="w-14 h-14 rounded-xl object-cover border border-[#E5E0DA]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-natural-darkolive truncate">{pet.name}</h4>
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          pet.status === "待認養"
                            ? "bg-natural-beige/30 text-natural-olive"
                            : "bg-natural-sage/20 text-natural-sagedark"
                        }`}
                      >
                        {pet.status}
                      </span>
                    </div>
                    <div className="flex gap-2 text-[10px] text-natural-text/60 mt-1 font-medium">
                      <span>種類: {pet.type}</span>
                      <span>•</span>
                      <span>年齡: {pet.age} {pet.ageUnit} ({pet.gender})</span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-natural-text/80 line-clamp-2 bg-white p-2 border border-[#E5E0DA]/50 rounded-lg">
                  {pet.description}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#E5E0DA]/50">
                  <span className="text-[10px] text-natural-text/40 font-mono">
                    創立日期: {getFormatDate(pet.createdAt)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(pet)}
                      className="px-2.5 py-1 text-[10px] font-bold border border-natural-sage/30 bg-natural-sage/10 text-natural-sagedark rounded-lg cursor-pointer"
                    >
                      {pet.status === "待認養" ? "登記認養" : "改為待領養"}
                    </button>
                    <button
                      onClick={() => handleOpenEdit(pet)}
                      className="p-1 px-2 text-[10px] border border-natural-border bg-white text-natural-text/80 rounded-lg cursor-pointer"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => handleDelete(pet.id, pet.name)}
                      className="p-1 px-2 text-[10px] border border-natural-border bg-white text-red-500 rounded-lg cursor-pointer"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- PET MODAL (ADD & EDIT) --- */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative transform transition-all">
            {/* Title Header */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-indigo-650" />
                <h3 className="font-bold text-slate-800 text-md">
                  {modalType === "add" ? "上架新寵物" : "編輯寵物基本檔案"}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Fields */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">寵物名稱 *</label>
                  <input
                    type="text"
                    required
                    value={formFields.name}
                    onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                    placeholder="請輸入寵物暱稱..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">種類 *</label>
                  <select
                    value={formFields.type}
                    onChange={(e) => setFormFields({ ...formFields, type: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="狗狗">狗狗</option>
                    <option value="貓咪">貓咪</option>
                    <option value="其他">其他小動物 / 兔子 / 鳥</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">年齡大小 *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formFields.age}
                    onChange={(e) => setFormFields({ ...formFields, age: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">時間單位 *</label>
                  <select
                    value={formFields.ageUnit}
                    onChange={(e) => setFormFields({ ...formFields, ageUnit: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="歲">歲</option>
                    <option value="個月">個月</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">性別 *</label>
                  <select
                    value={formFields.gender}
                    onChange={(e) => setFormFields({ ...formFields, gender: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="公">公</option>
                    <option value="母">母</option>
                    <option value="未知">未知</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">領養狀態 *</label>
                  <select
                    value={formFields.status}
                    onChange={(e) => setFormFields({ ...formFields, status: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="待認養">待認養</option>
                    <option value="已認養">已認養</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">特徵照連結 (選填)</label>
                  <input
                    type="url"
                    value={formFields.imageUrl}
                    onChange={(e) => setFormFields({ ...formFields, imageUrl: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                    placeholder="https://example.com/pet.jpg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">浪浪描述與飼養建議 (可使用適養描述，將直接供認養人參看)</label>
                <textarea
                  rows={4}
                  required
                  value={formFields.description}
                  onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder="請在此詳細填寫寵物的性格、由來背景、健康狀況、驅蟲狀況等資訊..."
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
