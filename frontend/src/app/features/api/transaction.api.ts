import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from '../../shared/models/types';

export interface Page<T> { items: T[]; total: number; page: number; pageSize: number; }

@Injectable({ providedIn: 'root' })
export class TransactionApi {
  constructor(private http: HttpClient) {}
  list(params: { userId: string; accountId?: string; from?: string; to?: string; q?: string; page?: number; pageSize?: number }): Observable<Page<Transaction>> {
    const { userId, ...rest } = params;
    return this.http.get<Page<Transaction>>('transactions', { params: { userId, ...rest } as any });
  }
}
