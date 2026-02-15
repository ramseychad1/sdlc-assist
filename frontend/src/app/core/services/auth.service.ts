import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User, LoginRequest } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) { }

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    get isLoggedIn(): boolean {
        return this.currentUserSubject.value !== null;
    }

    login(credentials: LoginRequest): Observable<User> {
        return this.http.post<User>(`${environment.apiUrl}/auth/login`, credentials, {
            withCredentials: true
        }).pipe(
            tap(user => this.currentUserSubject.next(user))
        );
    }

    logout(): Observable<void> {
        return this.http.post<void>(`${environment.apiUrl}/auth/logout`, {}, {
            withCredentials: true
        }).pipe(
            tap(() => this.currentUserSubject.next(null))
        );
    }

    checkSession(): Observable<User> {
        return this.http.get<User>(`${environment.apiUrl}/auth/me`, {
            withCredentials: true
        }).pipe(
            tap(user => this.currentUserSubject.next(user))
        );
    }
}
