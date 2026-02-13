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
  REQUEST = 'Request',
  ACCEPT = 'Accept',
  REJECT = 'Reject',
  IN_TRANSIT = 'InTransit',
  DELIVERED = 'Delivered',
}

export enum CallState {
  Idle = "idle",
  Calling = "calling",
  Ringing = "ringing",
  Connecting = "connecting",
  Connected = "connected",
}

export enum CallType {
  Audio = "audio",
  Video = "video",
}

export enum CallDirection {
  Incoming = "incoming",
  Outgoing = "outgoing",
}

export enum CallOutcome {
  Accepted = "accepted",
  Rejected = "rejected",
  Cancelled = "cancelled",
  Missed = "missed",
  Busy = "busy",
  Ended = "ended",
}

export enum ThemeMode {
  Light = "light",
  Dark = "dark",
}
