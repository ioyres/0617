export type PetStatus = '待認養' | '已認養';
export type ApplicationStatus = '審核中' | '已核准' | '已拒絕';

export interface Pet {
  id: string;
  name: string;
  type: string; // e.g. '貓咪', '狗狗', '其他'
  age: number;
  ageUnit: '歲' | '個月';
  gender: '公' | '母' | '未知';
  status: PetStatus;
  description: string;
  imageUrl?: string;
  createdAt: number; // timestamp
}

export interface AdoptionApplication {
  id: string;
  petId: string;
  petName: string;
  applicantName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  status: ApplicationStatus;
  appliedAt: number; // timestamp
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  bio: string;
  role: '管理員' | '一般會員';
  createdAt: number;
}

export interface ActivityLog {
  id: string;
  type: 'pet_add' | 'pet_edit' | 'pet_delete' | 'app_add' | 'app_status_update' | 'user_register';
  userEmail: string;
  detail: string;
  timestamp: number;
}

export interface SystemStats {
  pendingPetsCount: number;
  adoptionApplicationsCount: number;
  adoptedPetsCount: number;
  membersCount: number;
}
