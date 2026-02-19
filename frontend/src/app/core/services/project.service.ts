import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Project, ProjectRequest } from '../models/project.model';
import { ScreenDefinition } from '../models/screen-definition.model';
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

    saveDesignSystem(id: string, content: string): Observable<Project> {
        return this.http.put<Project>(`${this.baseUrl}/${id}/design-system`, { content }, { withCredentials: true });
    }

    selectTemplate(id: string, templateId: string): Observable<Project> {
        return this.http.put<Project>(`${this.baseUrl}/${id}/template`, { templateId }, { withCredentials: true });
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`, { withCredentials: true });
    }

    getScreens(projectId: string): Observable<ScreenDefinition[]> {
        return this.http.get<ScreenDefinition[]>(`${this.baseUrl}/${projectId}/screens`, { withCredentials: true });
    }

    saveScreens(projectId: string, screens: ScreenDefinition[]): Observable<ScreenDefinition[]> {
        return this.http.post<ScreenDefinition[]>(`${this.baseUrl}/${projectId}/screens`, screens, { withCredentials: true });
    }

    savePrototype(projectId: string, screenId: string, htmlContent: string): Observable<ScreenDefinition> {
        return this.http.put<ScreenDefinition>(`${this.baseUrl}/${projectId}/screens/${screenId}/prototype`, { htmlContent }, { withCredentials: true });
    }
}
