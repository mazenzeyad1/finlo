import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account } from '../../shared/models/types';

@Injectable({ providedIn: 'root' })
export class AccountApi {
  constructor(private http: HttpClient) {}
  list(userId: string): Observable<Account[]> {
    return this.http.get<Account[]>('accounts', { params: { userId } });
  }
}
