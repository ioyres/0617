import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  User,
  ShieldAlert,
  Phone,
  Mail,
  FileText,
  Save,
  CheckCircle,
  FileHeart,
  Notebook
} from "lucide-react";

interface ProfileSettingsProps {
  isFirebaseMode: boolean;
  onRefreshData: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  isFirebaseMode,
  onRefreshData
}) => {
  const { currentUser, updateUserBio } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || "");
      setPhone(currentUser.phone || "");
      setBio(currentUser.bio || "");
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      alert("請輸入顯示名稱！");
      return;
    }

    setSaving(true);
    setSuccess(false);

    try {
      await updateUserBio(displayName, phone, bio);
      setSuccess(true);
      onRefreshData();
      
      // Auto dismiss success toast after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      alert("更新個人資料失敗：" + err);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="text-center py-12 text-slate-400">
        請先完成註冊或登入後，才能編輯個人設定檔喔！
      </div>
    );
  }

  const getFormatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-natural-darkolive tracking-tight">個人檔案與設定</h2>
        <p className="text-xs text-natural-text/75 mt-1 font-medium">
          更新您的名字、聯絡資訊及個人簡介，您的聯絡電話及自傳將會預載於每次的認養申請書中，方便加速審核。
        </p>
      </div>

      {/* Profile Card & Info */}
      <div className="bg-white border border-natural-border/60 rounded-3xl p-6 md:p-8 card-shadow space-y-6">
        <div className="flex flex-col sm:flex-row gap-5 items-center pb-6 border-b border-natural-border/60">
          <div className="w-16 h-16 rounded-2xl bg-natural-beige text-natural-darkolive flex items-center justify-center font-extrabold text-xl shadow-md border border-natural-border">
            {displayName ? displayName.substring(0, 1).toUpperCase() : "U"}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h3 className="font-extrabold text-lg text-natural-darkolive leading-snug">{displayName || "認養會員"}</h3>
            <p className="text-xs text-natural-olive flex items-center justify-center sm:justify-start gap-1 font-semibold">
              <Mail className="w-3.5 h-3.5" />
              {currentUser.email}
            </p>
            <div className="flex gap-2 justify-center sm:justify-start mt-1 flex-wrap">
              <span className="text-[10px] bg-natural-sage/20 border border-natural-sage/35 px-2 py-0.5 rounded-lg text-natural-sagedark font-bold">
                身分: {currentUser.role}
              </span>
              <span className="text-[10px] bg-[#F9F7F5] border border-natural-border px-2 py-0.5 rounded-lg text-natural-text/80 font-bold">
                註冊時間: {getFormatDate(currentUser.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-natural-darkolive mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-natural-text/60" />
                個人顯示名稱 *
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#F9F7F5] border border-natural-border rounded-xl focus:bg-white focus:border-natural-sage focus:ring-1 focus:ring-natural-sage focus:outline-none font-medium text-natural-text"
                placeholder="請填寫您的暱稱或真實姓名"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-natural-darkolive mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-natural-text/60" />
                常用聯絡電話
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-[#F9F7F5] border border-natural-border rounded-xl focus:bg-white focus:border-natural-sage focus:ring-1 focus:ring-natural-sage focus:outline-none font-medium text-natural-text"
                placeholder="例如：0912-345678"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-natural-darkolive mb-1.5 flex items-center gap-1.5">
              <Notebook className="w-3.5 h-3.5 text-natural-text/60" />
              個人自選簡介 (居家飼育狀況介紹)
            </label>
            <textarea
              rows={5}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 bg-[#F9F7F5] border border-natural-border rounded-xl focus:bg-white focus:border-natural-sage focus:ring-1 focus:ring-natural-sage focus:outline-none font-medium text-natural-text leading-relaxed"
              placeholder="例如：我目前自己住，公寓有寬敞陽台。朝九晚五，每天有充足的時間陪伴宠物。以前養過貓，對貓咪日常起居很熟悉，希望能在這幫忙到可愛的浪浪..."
            />
            <p className="text-[10px] text-natural-text/60 mt-1 leading-snug">
              提示：填寫完整的自傳可讓寵物管理員了解您家中的居住、每日陪伴與飼宿狀況，對核准您的寵物認養書极其有幫助喔！
            </p>
          </div>

          {/* Toast and Action Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-natural-border/60">
            {success ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-natural-sagedark bg-natural-sage/15 border border-natural-sage/25 px-3.5 py-2 rounded-xl">
                <CheckCircle className="w-4 h-4 text-natural-sagedark" />
                個人設定更新成功！已同步至儲存庫。
              </span>
            ) : (
              <span className="text-[11px] text-natural-text/50 font-medium">
                所有的修改將會妥善保全。
              </span>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-natural-sage hover:bg-natural-sagedark disabled:bg-natural-sage/55 disabled:cursor-not-allowed text-white font-bold text-xs tracking-wide rounded-xl shadow-md cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? "正在同步儲存中..." : "儲存設定變更"}
            </button>
          </div>
        </form>
      </div>

      {/* Safety info board */}
      <div className="bg-[#FBF9F7] rounded-3xl border border-natural-border/60 p-5 flex gap-3 text-xs leading-relaxed text-natural-text/80">
        <ShieldAlert className="w-5 h-5 text-natural-olive mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-extrabold text-natural-darkolive text-xs">帳戶安全性與隱私規範</h4>
          <p className="text-[11px] text-natural-text/75 mt-1">
            為了您的隱私安全，我們不開放修改註冊登入用的 Email 信箱。如需變更主信箱，請洽詢您的系統管理員协助。本平台採取嚴格的加密儲存，不會將電話暴露於公開頁面中。
          </p>
        </div>
      </div>
    </div>
  );
};
