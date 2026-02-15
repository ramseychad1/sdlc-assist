import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserResponse {
  id: string;
  username: string;
  displayName: string;
  role: string;
  email: string | null;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  displayName: string;
  role: string;
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${environment.apiUrl}/admin/users`, {
      withCredentials: true,
    });
  }

  createUser(request: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${environment.apiUrl}/admin/users`, request, {
      withCredentials: true,
    });
  }

  resetPassword(userId: string, newPassword: string): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/admin/users/${userId}/password`, { newPassword }, {
      withCredentials: true,
    });
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/users/${userId}`, {
      withCredentials: true,
    });
  }
}
