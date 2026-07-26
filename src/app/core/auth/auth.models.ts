export type UserStatus =
  | 'PENDING_VERIFICATION'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';
export type UserRole = 'SHOP_OWNER' | 'ADMIN';

export interface ShopUser {
  id: string;
  fullName: string;
  shopName: string;
  phone: string;
  city: string;
  address: string;
  commercialRegPhotoUrl: string;
  status: UserStatus;
  role: UserRole;
  rejectionReason?: string;
  shopDiscountPercent?: number;
}

export interface AuthResponse {
  accessToken: string;
  user: ShopUser;
}
