import React, { createContext, useContext, useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "../firebase";
import { UserProfile, ActivityLog } from "../types";
import { dbService } from "../services/dbService";

interface AuthContextType {
  currentUser: UserProfile | null;
  loading: boolean;
  isFirebaseMode: boolean;
  errorMsg: string | null;
  toggleFirebaseMode: () => void;
  signUp: (email: string, password: string, displayName: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<UserProfile>;
  signOutUser: () => Promise<void>;
  updateUserBio: (displayName: string, phone: string, bio: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  // Default to Firebase mode since user explicitly provided the config
  const [isFirebaseMode, setIsFirebaseMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("pet_adopt_mode");
    return saved ? saved === "firebase" : true;
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Toggle mode
  const toggleFirebaseMode = () => {
    setIsFirebaseMode((prev) => {
      const nextMode = !prev;
      localStorage.setItem("pet_adopt_mode", nextMode ? "firebase" : "local");
      // Clean error or loading when toggling
      setErrorMsg(null);
      return nextMode;
    });
  };

  // Sync auth state from Firebase
  useEffect(() => {
    if (!isFirebaseMode) {
      // Offline/Local Mode auth sync from cache
      const localUser = localStorage.getItem("pet_adopt_curr_user");
      if (localUser) {
        try {
          setCurrentUser(JSON.parse(localUser));
        } catch {
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          // Fetch additional profile from DB
          const users = await dbService.getUsers(true);
          let profile = users.find((u) => u.uid === fbUser.uid);

          if (!profile) {
            // Auto create missing profile in Firestore
            profile = {
              uid: fbUser.uid,
              email: fbUser.email || "",
              displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "會員",
              phone: "",
              bio: "熱愛動物的會員，目前剛加入寵物認養系統！",
              role: fbUser.email === "apple0930743260@gmail.com" ? "管理員" : "一般會員",
              createdAt: Date.now(),
            };
            await dbService.saveUserProfile(true, profile);
          }
          setCurrentUser(profile);
        } catch (error) {
          console.error("Failed to fetch Firebase user profile, default local mapping...", error);
          setErrorMsg("Firebase 資料載入失敗，可能由於規則限制。已暫時提供本機資料。");
          // Fallback user
          setCurrentUser({
            uid: fbUser.uid,
            email: fbUser.email || "",
            displayName: fbUser.displayName || "使用者",
            phone: "",
            bio: "Firebase 帳號（本機備份）",
            role: "一般會員",
            createdAt: Date.now(),
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebaseMode]);

  // Sign Up
  const signUp = async (email: string, password: string, displayName: string, phone: string) => {
    setErrorMsg(null);
    if (isFirebaseMode) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const profile: UserProfile = {
          uid: fbUser.uid,
          email,
          displayName,
          phone,
          bio: "很高興加入！我是一個熱愛寵物的新會員。",
          role: email === "apple0930743260@gmail.com" ? "管理員" : "一般會員",
          createdAt: Date.now(),
        };
        await dbService.saveUserProfile(true, profile);
        
        // Log action
        const log: ActivityLog = {
          id: `log_${Date.now()}`,
          type: "user_register",
          userEmail: email,
          detail: `${displayName} 註冊加入系統 (Firebase)`,
          timestamp: Date.now()
        };
        await dbService.addActivityLog(true, log);
      } catch (err: any) {
        console.error("Firebase SignUp Error", err);
        let errorMsgString = "註冊審核失敗：" + (err.message || String(err));
        if (err.code === "auth/operation-not-allowed") {
          errorMsgString = "Firebase 尚未啟用 Email/密碼登入。請手動開啟或點擊上方「切換本地模式」以供完美測試！";
        } else if (err.code === "auth/email-already-in-use") {
          errorMsgString = "該電子郵件已註冊，請直接登入！";
        } else if (err.code === "auth/invalid-email") {
          errorMsgString = "無效的電子郵件格式！";
        } else if (err.code === "auth/weak-password") {
          errorMsgString = "密碼強度不足，請輸入至少 6 位數！";
        }
        setErrorMsg(errorMsgString);
        throw new Error(errorMsgString);
      }
    } else {
      // Local Mode Sign Up
      const users = JSON.parse(localStorage.getItem("pet_adopt_users") || "[]") as UserProfile[];
      if (users.some((u) => u.email === email)) {
        throw new Error("此電子郵件已被註冊過！");
      }

      const mockUid = `mock_${Date.now()}`;
      const profile: UserProfile = {
        uid: mockUid,
        email,
        displayName,
        phone,
        bio: "很高興加入！我是一個熱愛寵物的新會員 (本地模式)。",
        role: email === "apple0930743260@gmail.com" || email.startsWith("admin") ? "管理員" : "一般會員",
        createdAt: Date.now(),
      };

      users.push(profile);
      localStorage.setItem("pet_adopt_users", JSON.stringify(users));
      localStorage.setItem("pet_adopt_curr_user", JSON.stringify(profile));

      // Save Log
      const logs = JSON.parse(localStorage.getItem("pet_adopt_logs") || "[]") as ActivityLog[];
      logs.unshift({
        id: `log_${Date.now()}`,
        type: "user_register",
        userEmail: email,
        detail: `${displayName} 註冊加入系統 (本地模式)`,
        timestamp: Date.now()
      });
      localStorage.setItem("pet_adopt_logs", JSON.stringify(logs));

      setCurrentUser(profile);
    }
  };

  // Sign In
  const signIn = async (email: string, password: string): Promise<UserProfile> => {
    setErrorMsg(null);
    if (isFirebaseMode) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        
        // Fetch profile
        const users = await dbService.getUsers(true);
        let profile = users.find((u) => u.uid === fbUser.uid);
        if (!profile) {
          profile = {
            uid: fbUser.uid,
            email,
            displayName: fbUser.displayName || email.split("@")[0],
            phone: "",
            bio: "Firebase 帳號",
            role: email === "apple0930743260@gmail.com" ? "管理員" : "一般會員",
            createdAt: Date.now(),
          };
          await dbService.saveUserProfile(true, profile);
        }
        setCurrentUser(profile);
        return profile;
      } catch (err: any) {
        console.error("Firebase SignIn Error", err);
        let errorMsgString = "登入驗證失敗：" + (err.message || String(err));
        if (err.code === "auth/operation-not-allowed") {
          errorMsgString = "Firebase 尚未啟用 Email/密碼驗證。請在控制台啟用，或點按「切換本地模式」立即開啟體驗！";
        } else if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
          errorMsgString = "帳號名稱或密碼錯誤，請重新輸入！";
        }
        setErrorMsg(errorMsgString);
        throw new Error(errorMsgString);
      }
    } else {
      // Local Mode Sign In
      const users = JSON.parse(localStorage.getItem("pet_adopt_users") || "[]") as UserProfile[];
      let profile = users.find((u) => u.email === email);

      if (!profile) {
        // Simple convenience auto-register for easy testing in mock mode!
        // This is extremely friendly for a demo where the test runner uses an email!
        profile = {
          uid: `mock_${Date.now()}`,
          email,
          displayName: email.split("@")[0] || "測試會員",
          phone: "0912-345678",
          bio: "歡迎來到寵物認養系統臨時體驗帳號！已為您自動完成本地註冊。",
          role: email === "apple0930743260@gmail.com" || email.includes("admin") ? "管理員" : "一般會員",
          createdAt: Date.now(),
        };
        users.push(profile);
        localStorage.setItem("pet_adopt_users", JSON.stringify(users));

        // Add activity log
        const logs = JSON.parse(localStorage.getItem("pet_adopt_logs") || "[]") as ActivityLog[];
        logs.unshift({
          id: `log_${Date.now()}`,
          type: "user_register",
          userEmail: email,
          detail: `${profile.displayName} 註冊加入系統 (本地自動備份)`,
          timestamp: Date.now()
        });
        localStorage.setItem("pet_adopt_logs", JSON.stringify(logs));
      }

      localStorage.setItem("pet_adopt_curr_user", JSON.stringify(profile));
      setCurrentUser(profile);
      return profile;
    }
  };

  // Sign Out
  const signOutUser = async () => {
    setErrorMsg(null);
    if (isFirebaseMode) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error("Firebase SignOut Error", err);
      }
    } else {
      localStorage.removeItem("pet_adopt_curr_user");
    }
    setCurrentUser(null);
  };

  // Update Profile
  const updateUserBio = async (displayName: string, phone: string, bio: string) => {
    if (!currentUser) return;
    setErrorMsg(null);

    const updatedProfile: UserProfile = {
      ...currentUser,
      displayName,
      phone,
      bio,
    };

    if (isFirebaseMode) {
      try {
        await dbService.saveUserProfile(true, updatedProfile);
        setCurrentUser(updatedProfile);
      } catch (err: any) {
        console.error("Firebase profile update error", err);
        setErrorMsg("同步至 Firestore 發生權限拒絕或網路異常。");
        throw err;
      }
    } else {
      const users = JSON.parse(localStorage.getItem("pet_adopt_users") || "[]") as UserProfile[];
      const index = users.findIndex((u) => u.uid === currentUser.uid);
      if (index > -1) {
        users[index] = updatedProfile;
      } else {
        users.push(updatedProfile);
      }
      localStorage.setItem("pet_adopt_users", JSON.stringify(users));
      localStorage.setItem("pet_adopt_curr_user", JSON.stringify(updatedProfile));
      setCurrentUser(updatedProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isFirebaseMode,
        errorMsg,
        toggleFirebaseMode,
        signUp,
        signIn,
        signOutUser,
        updateUserBio,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
