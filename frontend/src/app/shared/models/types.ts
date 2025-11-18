export type Provider = 'flinks' | 'manual';

export interface Institution { id: string; name: string; logoUrl?: string; provider: Provider; }
export interface Connection { id: string; institutionId: string; status: 'active'|'error'|'revoked'; linkedAt: string; }
export interface Account { id: string; connectionId: string; name: string; mask?: string; type: 'checking'|'savings'|'credit'|'loan'|'investment'; currency: string; balance: number; }
export interface Transaction { id: string; accountId: string; date: string; description: string; amount: number; currency: string; pending: boolean; }
export interface Budget { id: string; name: string; period: 'monthly'|'weekly'|'custom'; start: string; end: string; amount: number; categories: string[]; }
