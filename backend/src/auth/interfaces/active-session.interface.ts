export interface ActiveSession {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: Date;
  lastSeen: Date;
  current: boolean;
}
