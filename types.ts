
export enum UserRole {
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER'
}

export interface User {
  username: string;
  role: UserRole;
}

export interface SizeQuantities {
  size1: number;
  size2: number;
  oneSize: number;
}

export interface ModelColor {
  id: string;
  name: string;
  quantities: SizeQuantities;
}

export interface ClothingModel {
  id: string;
  name: string;
  image: string; // Base64 or URL
  price: number;
  fabric: string;
  colors: ModelColor[];
  createdAt: number;
}

export interface AuditLog {
  id: string;
  action: string;
  details: string;
  timestamp: number;
  type: 'add' | 'update' | 'delete';
}

export interface InventoryStats {
  totalModels: number;
  totalItems: number;
}
