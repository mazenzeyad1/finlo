import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Connection } from '../../shared/models/types';

@Injectable({ providedIn: 'root' })
export class ConnectionApi {
  constructor(private http: HttpClient) {}
  startLink(body: { userId: string }) {
    return this.http.post<{ linkToken: string }>('connections/link/start', body);
  }
  exchange(body: { userId: string; publicToken: string }) {
    return this.http.post<{ connectionId: string }>('connections/link/exchange', body);
  }
  list(userId: string): Observable<Connection[]> {
    return this.http.get<Connection[]>('connections', { params: { userId } });
  }
}
