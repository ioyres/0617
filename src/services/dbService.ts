import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { Pet, AdoptionApplication, UserProfile, ActivityLog, SystemStats } from "../types";

// Default/Initial Mock Data for Bootstrap
const initialPets: Pet[] = [
  {
    id: "pet_1",
    name: "波波 (Bobo)",
    type: "狗狗",
    age: 2,
    ageUnit: "歲",
    gender: "公",
    status: "待認養",
    description: "非常親人活潑的黃金獵犬，喜歡玩飛盤，已經完成結紮與疫苗施打。",
    imageUrl: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600",
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    id: "pet_2",
    name: "咪咪 (Mimi)",
    type: "貓咪",
    age: 6,
    ageUnit: "個月",
    gender: "母",
    status: "待認養",
    description: "親人愛撒嬌的三花小幼貓，會用貓砂盆，愛呼嚕，非常適合新手家庭。",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600",
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
  {
    id: "pet_3",
    name: "阿呆 (Dumbo)",
    type: "狗狗",
    age: 4,
    ageUnit: "歲",
    gender: "公",
    status: "已認養",
    description: "性格沉穩、安靜的黑柴，親狗、親貓，已被愛心家庭領養。",
    imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600",
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },
  {
    id: "pet_4",
    name: "雪球 (Snowball)",
    type: "其他",
    age: 1,
    ageUnit: "歲",
    gender: "母",
    status: "待認養",
    description: "漂亮的白兔，溫馴乖巧，喜歡吃新鮮草和胡蘿蔔。期待找到好主人。",
    imageUrl: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&q=80&w=600",
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  }
];

const initialApplications: AdoptionApplication[] = [
  {
    id: "app_1",
    petId: "pet_1",
    petName: "波波 (Bobo)",
    applicantName: "王小明",
    contactPhone: "0912-345678",
    contactEmail: "xiaoming@example.com",
    notes: "家中有寬敞的庭院，以前養過狗，全家人都非常喜愛動物，能保證給波波充足的陪伴與運動時間。",
    status: "審核中",
    appliedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: "app_2",
    petId: "pet_3",
    petName: "阿呆 (Dumbo)",
    applicantName: "陳雅婷",
    contactPhone: "0987-654321",
    contactEmail: "yating@example.com",
    notes: "已經完成領養程序，阿呆目前適應良好！感謝寵物認養系統提供的協助。",
    status: "已核准",
    appliedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
  }
];

const initialUsers: UserProfile[] = [
  {
    uid: "mock_admin_1",
    email: "admin@petadopt.tw",
    displayName: "系統管理員",
    phone: "0900-111222",
    bio: "負責維護本系統的寵物審核與一般使用者認養申請流，歡迎大家多分享領養資訊！",
    role: "管理員",
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    uid: "mock_user_1",
    email: "apple0930743260@gmail.com", // From system prompt as main test user
    displayName: "王大同",
    phone: "0912-888999",
    bio: "熱愛動物的寵物愛好者。希望能給浪浪們一個溫暖的家。",
    role: "管理員", // Give active role to test user so they can utilize full dashboard
    createdAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
  }
];

const initialLogs: ActivityLog[] = [
  {
    id: "log_1",
    type: "user_register",
    userEmail: "admin@petadopt.tw",
    detail: "系統管理員 註冊加入系統",
    timestamp: Date.now() - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: "log_2",
    type: "pet_add",
    userEmail: "admin@petadopt.tw",
    detail: "新增寵物資料：波波 (Bobo)",
    timestamp: Date.now() - 10 * 24 * 60 * 60 * 1000,
  },
  {
    id: "log_3",
    type: "pet_add",
    userEmail: "admin@petadopt.tw",
    detail: "新增寵物資料：阿呆 (Dumbo)",
    timestamp: Date.now() - 20 * 24 * 60 * 60 * 1000,
  },
  {
    id: "log_4",
    type: "app_add",
    userEmail: "xiaoming@example.com",
    detail: "王小明 送出了對 波波 (Bobo) 的認養申請",
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
  }
];

// LocalStorage helpers
function getLocal<T>(key: string, orElse: T): T {
  const data = localStorage.getItem(`pet_adopt_${key}`);
  if (!data) return orElse;
  try {
    return JSON.parse(data) as T;
  } catch {
    return orElse;
  }
}

function setLocal<T>(key: string, value: T) {
  localStorage.setItem(`pet_adopt_${key}`, JSON.stringify(value));
}

// Ensure local storage is initialized
if (!localStorage.getItem("pet_adopt_pets")) {
  setLocal("pets", initialPets);
}
if (!localStorage.getItem("pet_adopt_applications")) {
  setLocal("applications", initialApplications);
}
if (!localStorage.getItem("pet_adopt_users")) {
  setLocal("users", initialUsers);
}
if (!localStorage.getItem("pet_adopt_logs")) {
  setLocal("logs", initialLogs);
}

export const dbService = {
  // --- PETS OPERATIONS ---
  async getPets(useFirestore: boolean): Promise<Pet[]> {
    if (useFirestore) {
      try {
        const querySnapshot = await getDocs(collection(db, "pets"));
        const petsList: Pet[] = [];
        querySnapshot.forEach((doc) => {
          petsList.push({ id: doc.id, ...doc.data() } as Pet);
        });
        if (petsList.length === 0) {
          // Sync default batch to Firestore if empty
          for (const pet of initialPets) {
            await setDoc(doc(db, "pets", pet.id), pet);
            petsList.push(pet);
          }
        }
        return petsList.sort((a, b) => b.createdAt - a.createdAt);
      } catch (error) {
        console.warn("Firestore count/read failed, falling back to local database...", error);
        return this.getPets(false);
      }
    } else {
      return getLocal<Pet[]>("pets", []).sort((a, b) => b.createdAt - a.createdAt);
    }
  },

  async savePet(useFirestore: boolean, pet: Pet, isNew: boolean): Promise<void> {
    if (useFirestore) {
      const operation = isNew ? OperationType.CREATE : OperationType.UPDATE;
      try {
        const docRef = doc(db, "pets", pet.id);
        await setDoc(docRef, pet);
      } catch (error) {
        handleFirestoreError(error, operation, `pets/${pet.id}`);
      }
    } else {
      const pets = getLocal<Pet[]>("pets", []);
      if (isNew) {
        pets.push(pet);
      } else {
        const index = pets.findIndex((p) => p.id === pet.id);
        if (index > -1) pets[index] = pet;
      }
      setLocal("pets", pets);
    }
  },

  async deletePet(useFirestore: boolean, petId: string): Promise<void> {
    if (useFirestore) {
      try {
        await deleteDoc(doc(db, "pets", petId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `pets/${petId}`);
      }
    } else {
      const pets = getLocal<Pet[]>("pets", []);
      const newPets = pets.filter((p) => p.id !== petId);
      setLocal("pets", newPets);
    }
  },

  // --- ADOPTION APPLICATIONS OPERATIONS ---
  async getApplications(useFirestore: boolean): Promise<AdoptionApplication[]> {
    if (useFirestore) {
      try {
        const querySnapshot = await getDocs(collection(db, "applications"));
        const appsList: AdoptionApplication[] = [];
        querySnapshot.forEach((doc) => {
          appsList.push({ id: doc.id, ...doc.data() } as AdoptionApplication);
        });
        if (appsList.length === 0) {
          // Sync default
          for (const appItem of initialApplications) {
            await setDoc(doc(db, "applications", appItem.id), appItem);
            appsList.push(appItem);
          }
        }
        return appsList.sort((a, b) => b.appliedAt - a.appliedAt);
      } catch (error) {
        console.warn("Firestore applications read failed, falling back to local...", error);
        return this.getApplications(false);
      }
    } else {
      return getLocal<AdoptionApplication[]>("applications", []).sort((a, b) => b.appliedAt - a.appliedAt);
    }
  },

  async saveApplication(useFirestore: boolean, appItem: AdoptionApplication, isNew: boolean): Promise<void> {
    if (useFirestore) {
      const operation = isNew ? OperationType.CREATE : OperationType.UPDATE;
      try {
        const docRef = doc(db, "applications", appItem.id);
        await setDoc(docRef, appItem);
      } catch (error) {
        handleFirestoreError(error, operation, `applications/${appItem.id}`);
      }
    } else {
      const apps = getLocal<AdoptionApplication[]>("applications", []);
      if (isNew) {
        apps.push(appItem);
      } else {
        const index = apps.findIndex((a) => a.id === appItem.id);
        if (index > -1) apps[index] = appItem;
      }
      setLocal("applications", apps);
    }
  },

  async deleteApplication(useFirestore: boolean, appId: string): Promise<void> {
    if (useFirestore) {
      try {
        await deleteDoc(doc(db, "applications", appId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `applications/${appId}`);
      }
    } else {
      const apps = getLocal<AdoptionApplication[]>("applications", []);
      const newApps = apps.filter((a) => a.id !== appId);
      setLocal("applications", newApps);
    }
  },

  // --- MEMBER PROFILE OPERATIONS ---
  async getUsers(useFirestore: boolean): Promise<UserProfile[]> {
    if (useFirestore) {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList: UserProfile[] = [];
        querySnapshot.forEach((doc) => {
          usersList.push({ uid: doc.id, ...doc.data() } as UserProfile);
        });
        if (usersList.length === 0) {
          // Sync default
          for (const u of initialUsers) {
            await setDoc(doc(db, "users", u.uid), u);
            usersList.push(u);
          }
        }
        return usersList;
      } catch (error) {
        console.warn("Firestore users read failed, falling back to local...", error);
        return this.getUsers(false);
      }
    } else {
      return getLocal<UserProfile[]>("users", []);
    }
  },

  async saveUserProfile(useFirestore: boolean, profile: UserProfile): Promise<void> {
    if (useFirestore) {
      try {
        await setDoc(doc(db, "users", profile.uid), profile);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
      }
    } else {
      const users = getLocal<UserProfile[]>("users", []);
      const index = users.findIndex((u) => u.uid === profile.uid);
      if (index > -1) {
        users[index] = profile;
      } else {
        users.push(profile);
      }
      setLocal("users", users);
    }
  },

  // --- ACTIVITY LOGS OPERATIONS ---
  async getActivityLogs(useFirestore: boolean): Promise<ActivityLog[]> {
    if (useFirestore) {
      try {
        const querySnapshot = await getDocs(collection(db, "activity_logs"));
        const logsList: ActivityLog[] = [];
        querySnapshot.forEach((doc) => {
          logsList.push({ id: doc.id, ...doc.data() } as ActivityLog);
        });
        if (logsList.length === 0) {
          // Sync default
          for (const log of initialLogs) {
            await setDoc(doc(db, "activity_logs", log.id), log);
            logsList.push(log);
          }
        }
        return logsList.sort((a, b) => b.timestamp - a.timestamp);
      } catch (error) {
        console.warn("Firestore activity logs read failed, falling back to local...", error);
        return this.getActivityLogs(false);
      }
    } else {
      return getLocal<ActivityLog[]>("logs", []).sort((a, b) => b.timestamp - a.timestamp);
    }
  },

  async addActivityLog(useFirestore: boolean, log: ActivityLog): Promise<void> {
    if (useFirestore) {
      try {
        await setDoc(doc(db, "activity_logs", log.id), log);
      } catch (error) {
        // Log locally if failed, handle silently as logging shouldn't break UI
        const logs = getLocal<ActivityLog[]>("logs", []);
        logs.push(log);
        setLocal("logs", logs);
      }
    } else {
      const logs = getLocal<ActivityLog[]>("logs", []);
      logs.push(log);
      setLocal("logs", logs);
    }
  },

  // --- UTILITY SYSTEM STATISTICS ---
  async getStats(useFirestore: boolean): Promise<SystemStats> {
    const pets = await this.getPets(useFirestore);
    const apps = await this.getApplications(useFirestore);
    const users = await this.getUsers(useFirestore);

    return {
      pendingPetsCount: pets.filter((p) => p.status === "待認養").length,
      adoptionApplicationsCount: apps.length,
      adoptedPetsCount: pets.filter((p) => p.status === "已認養").length,
      membersCount: users.length,
    };
  }
};
