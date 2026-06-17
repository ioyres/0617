import React, { useEffect, useState } from "react";
import { UserProfile, ActivityLog } from "../types";
import { dbService } from "../services/dbService";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Clock,
  History,
  Phone,
  Mail,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";

interface MemberManagementProps {
  isFirebaseMode: boolean;
  onRefreshData: () => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  isFirebaseMode,
  onRefreshData
}) => {
  const { currentUser } = useAuth();
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const userList = await dbService.getUsers(isFirebaseMode);
      setMembers(userList);

      const logs = await dbService.getActivityLogs(isFirebaseMode);
      setActivityLogs(logs);
    } catch (error) {
      console.error("Error loading members & activity logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isFirebaseMode]);

  const handleToggleRole = async (member: UserProfile) => {
    if (member.uid === currentUser?.uid) {
      alert("您無法修改您自己的角色權限喔！");
      return;
    }

    const newRole = member.role === "管理員" ? "一般會員" : "管理員";
    const phrase = newRole === "管理員" ? "升級為系統管理員" : "回復為一般會員";

    if (!window.confirm(`確定要將「${member.displayName}」的角色 ${phrase} 嗎？`)) return;

    const updatedProfile: UserProfile = {
      ...member,
      role: newRole
    };

    try {
      await dbService.saveUserProfile(isFirebaseMode, updatedProfile);

      // Create log
      const log: ActivityLog = {
        id: `log_${Date.now()}`,
        type: "app_status_update",
        userEmail: currentUser?.email || "admin@petadopt.tw",
        detail: `修改「${member.displayName}」的安全防護角色為：【${newRole}】`,
        timestamp: Date.now()
      };
      await dbService.addActivityLog(isFirebaseMode, log);

      loadData();
      onRefreshData();
    } catch (err) {
      alert("儲存角色變更失敗：" + err);
    }
  };

  // Filters
  const filteredMembers = members.filter((m) => {
    return (
      m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm) ||
      m.bio.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getFormatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return `${d.getFullYear()}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-extrabold text-natural-darkolive tracking-tight">會員管理與日誌儀表</h2>
        <p className="text-xs text-natural-text/75 mt-1 font-medium">
          檢視本系統已註冊的認養會員帳戶，可管理會員權限角色，並同時查看完整的系統後台操作紀錄。
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Members Column */}
        <div className="xl:col-span-2 bg-white border border-natural-border/60 rounded-3xl p-6 card-shadow space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-natural-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-natural-sage/10 text-natural-sagedark rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-natural-darkolive text-sm">已註冊帳號列表 ({filteredMembers.length})</h3>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-natural-text/60" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜尋姓名、信箱、自傳..."
                className="text-xs pl-8 pr-3 py-1.5 w-full sm:w-48 bg-[#F9F7F5] border border-natural-border rounded-xl focus:bg-white focus:border-natural-sage outline-none font-medium text-natural-text"
              />
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4 py-8">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-natural-beige/30 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-natural-beige/25 rounded w-1/4" />
                    <div className="h-3 bg-natural-beige/25 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-12 text-natural-text/60 text-xs">沒有對應的會員。</div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {filteredMembers.map((member) => (
                <div
                  key={member.uid}
                  className="p-4 bg-[#FBF9F7] rounded-2xl border border-natural-border/60 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:border-natural-sage/40 transition-all"
                >
                  <div className="flex gap-3 items-start">
                    <div className="w-10 h-10 rounded-xl bg-natural-beige text-natural-darkolive font-extrabold flex items-center justify-center text-sm flex-shrink-0 border border-natural-border/50">
                      {member.displayName.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-natural-darkolive text-xs">{member.displayName}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                            member.role === "管理員"
                              ? "bg-natural-sage/20 text-natural-sagedark border border-natural-sage/35"
                              : "bg-natural-beige/30 text-natural-olive border border-natural-beige/50"
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 text-[10px] text-natural-text/80 mt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-natural-text/50" /> {member.email}
                        </span>
                        {member.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-natural-text/50" /> {member.phone}
                          </span>
                        )}
                        <span className="text-natural-text/65 mt-1 italic block max-w-sm truncate">
                          自傳敘述: “{member.bio || "暫未填寫介紹..."}”
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 border-t sm:border-0 pt-2 sm:pt-0 border-natural-border">
                    <span className="text-[10px] text-natural-text/40 font-mono">
                      加入日期: {getFormatDate(member.createdAt).split(" ")[0]}
                    </span>
                    <button
                      onClick={() => handleToggleRole(member)}
                      disabled={member.uid === currentUser?.uid}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        member.uid === currentUser?.uid
                          ? "bg-[#F5F2EE] text-natural-text/40 border-natural-border cursor-not-allowed"
                          : member.role === "管理員"
                          ? "bg-rose-50 border-rose-250 text-rose-700 hover:bg-rose-100"
                          : "bg-natural-sage/10 border-natural-sage/25 text-natural-sagedark hover:bg-natural-sage/20"
                      }`}
                    >
                      {member.role === "管理員" ? "調降為普通會員" : "晉升為管理員"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operating Audit Logs Column */}
        <div className="bg-white border border-natural-border/60 rounded-3xl p-6 card-shadow max-h-[660px] flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-natural-border/60 pb-4 mb-4">
              <div className="p-1.5 bg-natural-sage/10 text-natural-sagedark rounded-lg">
                <History className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-natural-darkolive text-sm font-sans mb-1">系統完整活動軌跡</h3>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-10 bg-natural-beige/25 rounded-lg w-full" />
                ))}
              </div>
            ) : activityLogs.length === 0 ? (
              <div className="text-center py-12 text-natural-text/50 text-xs font-semibold">尚無任何操作日誌紀錄。</div>
            ) : (
              <div className="space-y-3.5 overflow-y-auto max-h-[460px] pr-1">
                {activityLogs.map((log) => (
                  <div key={log.id} className="text-xs bg-[#FBF9F7] p-3 rounded-xl border border-natural-border font-medium">
                    <p className="font-bold text-natural-darkolive leading-normal">{log.detail}</p>
                    <div className="flex items-center justify-between text-[10px] text-natural-text/50 mt-2 font-mono">
                      <span className="truncate max-w-[130px]">{log.userEmail}</span>
                      <span>{getFormatDate(log.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
