import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, ProjectRequest } from '../models/project.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private baseUrl = `${environment.apiUrl}/projects`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Project[]> {
        return this.http.get<Project[]>(this.baseUrl, { withCredentials: true });
    }

    getById(id: string): Observable<Project> {
        return this.http.get<Project>(`${this.baseUrl}/${id}`, { withCredentials: true });
    }

    create(request: ProjectRequest): Observable<Project> {
        return this.http.post<Project>(this.baseUrl, request, { withCredentials: true });
    }

    update(id: string, request: ProjectRequest): Observable<Project> {
        return this.http.put<Project>(`${this.baseUrl}/${id}`, request, { withCredentials: true });
    }

    savePrd(id: string, content: string): Observable<Project> {
        return this.http.put<Project>(`${this.baseUrl}/${id}/prd`, { content }, { withCredentials: true });
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
    }
}
