export interface Item {
  _id: string;
  name: string;
  stock: number;
}

export interface User {
    id: number;
    username: string;
    password: string | null;
    role: string;
    branchId: number;
    branch: string | null;
    createdAt: number | null;
    isRemoved: boolean;
}

export interface Branch {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
  updatedBy: number | null;
  isRemoved: boolean;
  name: string;
  address: string;
  phone: string;
}

// Generic pagination response interface for reuse across modules
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: string;
  pageSize: string;
  totalPages: number;
}

export interface PurchaseResponseDto {
  id: number;
  productName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  lowStockThreshold: number;
  brand: string;
  userId: number;
  branchId?: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: number;
  updatedBy?: number;
  isRemoved: boolean;
}

export interface Inventory {
  id: string;
  productName: string;
  currentQuantity: number;
  unit: string;
  lowStockThreshold: number;
  brand: string;
  branchId?: number;
  branch?: any;
  lastPurchaseDate: Date;
  totalPurchased: number;
}

export interface PurchaseDto {
  productName: string;
  quantity: string;
  unit: string;
  pricePerUnit: string;
  totalPrice: string;
  lowStockThreshold: string;
  brand: string;
  branchId?: number;
}

export interface RequestDto {
  adminUserId: number;
  purchaseId: number;
  quantityRequested: number;
}

export interface RequestResponseDto {
  id: number;
  adminUserId: number;
  purchaseId: number;
  quantityRequested: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  requestingUser?: { username: string };
  adminUser?: { username: string };
  purchase?: any; // the purchase object
}