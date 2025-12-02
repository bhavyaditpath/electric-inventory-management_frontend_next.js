export enum UserRole {
  ADMIN = 'Admin',
  BRANCH = 'Branch',
}

export enum AlertPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertType {
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  EXPIRING_SOON = 'expiring_soon',
}

export enum AlertStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum RequestStatus {
  REQUEST = 'REQUEST',
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
}