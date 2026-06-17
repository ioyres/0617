import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { PawPrint, Mail, Lock, User, Phone, ShieldCheck, Database, Info, Loader2 } from "lucide-react";

export const LoginRegister: React.FC = () => {
  const { signIn, signUp, isFirebaseMode, toggleFirebaseMode, errorMsg } = useAuth();
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    setLoading(true);

    try {
      if (isLoginTab) {
        await signIn(email, password);
      } else {
        if (!displayName.trim()) {
          setLocalErr("請填寫會員暱稱名稱");
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName, phone);
      }
    } catch (error: any) {
      console.warn("Auth process rejected:", error);
      // Fallback detail already set inside AuthContext
      setLocalErr(error.message || "安全認證未過，請檢查。");
    } finally {
      setLoading(false);
    }
  };

  // Demo direct pass to let them test everything instantly if they wish
  const handleQuickBypass = async () => {
    setLocalErr(null);
    setLoading(true);
    try {
      // Toggle to local mode if not already
      if (isFirebaseMode) {
        toggleFirebaseMode();
      }
      // Wait momentarily for rendering
      setTimeout(async () => {
        try {
          await signIn("apple0930743260@gmail.com", "bypassed123");
        } catch (err) {
          console.error("Local fast sign in failed", err);
        } finally {
          setLoading(false);
        }
      }, 500);
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-natural-bg p-4 relative overflow-hidden font-sans">
      {/* Background Decorator Circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square bg-natural-sage/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] aspect-square bg-natural-beige/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl border border-natural-border/60 shadow-xl overflow-hidden relative z-10 flex flex-col justify-between">
        {/* Top Header Mode Toggle Indicator */}
        <div className="bg-natural-darkolive text-white px-6 py-3 flex items-center justify-between text-xs font-semibold select-none border-b border-natural-border/30">
          <div className="flex items-center gap-1.5 text-natural-beige">
            <Database className="w-4 h-4 text-natural-sage" />
            <span>資料庫位置：</span>
          </div>
          <button
            onClick={toggleFirebaseMode}
            className={`px-3 py-1 bg-white/10 hover:bg-white/15 active:bg-white/20 transition-all rounded-full border border-white/10 text-xs font-bold cursor-pointer ${
              isFirebaseMode ? "text-natural-beige font-extrabold" : "text-white/60"
            }`}
          >
            {isFirebaseMode ? "🔌 Firebase 雲端模式" : "💾 本機 Local 模式"}
          </button>
        </div>

        {/* Content Portal */}
        <div className="p-6 md:p-8">
          {/* Logo Brand */}
          <div className="flex flex-col items-center text-center space-y-2 mb-8">
            <div className="p-3 bg-natural-sage/10 text-natural-sagedark rounded-3xl shadow-sm border border-natural-sage/25">
              <PawPrint className="w-8 h-8" />
            </div>
            <div>
              <h1 className="font-extrabold text-xl text-natural-darkolive tracking-tight">寵物認養管理系統</h1>
              <p className="text-xs text-natural-text/75 mt-1 font-semibold">
                「以認養代替購買」• 與流浪動物開啟專屬緣分
              </p>
            </div>
          </div>

          {/* Form Tabs Selection */}
          <div className="neutralbg p-1 bg-[#F5F2EE] rounded-2xl flex items-center mb-6 border border-natural-border/30">
            <button
              onClick={() => {
                setIsLoginTab(true);
                setLocalErr(null);
              }}
              disabled={loading}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                isLoginTab ? "bg-white text-natural-darkolive shadow-md" : "text-natural-text/70 hover:text-[#5A5A40]"
              }`}
            >
              會員登入
            </button>
            <button
              onClick={() => {
                setIsLoginTab(false);
                setLocalErr(null);
              }}
              disabled={loading}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                !isLoginTab ? "bg-white text-natural-darkolive shadow-md" : "text-natural-text/70 hover:text-[#5A5A40]"
              }`}
            >
              帳號註冊
            </button>
          </div>

          {/* Combined Error Alerts */}
          {(localErr || errorMsg) && (
            <div className="mb-5 p-3.5 bg-amber-50 text-amber-800 rounded-xl border border-amber-250 text-xs leading-relaxed">
              <div className="flex gap-2 items-start font-bold">
                <Info className="w-4 h-4 text-amber-655 flex-shrink-0" />
                <span>作業提示：</span>
              </div>
              <p className="text-amber-700 mt-1 text-[11px] font-semibold leading-relaxed">
                {localErr || errorMsg}
              </p>
              {isFirebaseMode && (
                <button
                  type="button"
                  onClick={toggleFirebaseMode}
                  className="mt-2 text-[11px] font-bold text-natural-olive hover:underline block cursor-pointer"
                >
                  ⚙️ 懶得設定 Firebase？點此一鍵切換「本地展示模式」免登入體驗 ➜
                </button>
              )}
            </div>
          )}

          {/* Form Fields body */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold text-natural-darkolive mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-natural-text/50" />
                電子郵件 (E-mail) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border bg-[#F9F7F5] rounded-xl focus:bg-white focus:border-natural-sage focus:outline-none font-medium text-natural-text"
                placeholder="adopt@example.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-natural-darkolive mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-natural-text/50" />
                登入安全密碼 (6位數以上) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full text-xs px-3.5 py-2.5 border border-natural-border bg-[#F9F7F5] rounded-xl focus:bg-white focus:border-natural-sage focus:outline-none font-medium text-natural-text"
                placeholder="••••••"
              />
            </div>

            {!isLoginTab && (
              <>
                <div>
                  <label className="block text-[11px] font-extrabold text-natural-darkolive mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-natural-text/50" />
                    會員暱稱名稱 *
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                    className="w-full text-xs px-3.5 py-2.5 border border-natural-border bg-[#F9F7F5] rounded-xl focus:bg-white focus:border-natural-sage focus:outline-none font-medium text-natural-text"
                    placeholder="例如：林大仁"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-natural-darkolive mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-natural-text/50" />
                    行動電話 (聯絡用)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    className="w-full text-xs px-3.5 py-2.5 border border-natural-border bg-[#F9F7F5] rounded-xl focus:bg-white focus:border-natural-sage focus:outline-none font-medium text-natural-text"
                    placeholder="0912-345678"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-natural-sage hover:bg-natural-sagedark disabled:bg-natural-sage/55 disabled:cursor-not-allowed transition-colors text-white font-bold text-xs rounded-xl shadow-md cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>正在交易保護驗證中...</span>
                </>
              ) : (
                <span>{isLoginTab ? "安全登入進度儀" : "註冊新任用會員"}</span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-natural-border/60 font-medium"></div>
            <span className="flex-shrink mx-4 text-[10px] text-natural-text/50 font-bold uppercase">或</span>
            <div className="flex-grow border-t border-natural-border/60 font-medium"></div>
          </div>

          {/* One-click bypass / testing trigger */}
          <button
            onClick={handleQuickBypass}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-natural-sage/30 bg-natural-sage/5 hover:bg-natural-sage/10 active:bg-natural-sage/20 text-natural-sagedark hover:text-[#5A5A40] disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-xs font-extrabold rounded-xl transition-colors cursor-pointer"
          >
            🌟 點按免打字：一鍵快速進入（體驗測試模式）
          </button>
        </div>

        {/* Footer info banner */}
        <div className="bg-[#FBF9F7] border-t border-natural-border/60 px-6 py-4 flex items-center gap-2.5 text-[10px] text-natural-text/75 leading-relaxed justify-center text-center">
          <ShieldCheck className="w-4 h-4 text-natural-olive flex-shrink-0" />
          <span>我們使用 256 位元端對端加密機制管理全台所有的浪浪認養資料安全。</span>
        </div>
      </div>
    </div>
  );
};
