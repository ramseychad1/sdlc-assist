import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { Project, ProjectRequest } from '../models/project.model';
import { ScreenDefinition } from '../models/screen-definition.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ProjectService {
    private baseUrl = `${environment.apiUrl}/projects`;

    /** Emits a project ID whenever that project's data changes (PRD saved, template selected, etc.) */
    private projectChanged = new Subject<string>();
    projectChanged$ = this.projectChanged.asObservable();

    notifyProjectChanged(id: string): void {
        this.projectChanged.next(id);
    }

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

    saveRefinedPrototype(projectId: string, screenId: string, htmlContent: string): Observable<ScreenDefinition> {
        return this.http.patch<ScreenDefinition>(`${this.baseUrl}/${projectId}/screens/${screenId}/prototype`, { htmlContent }, { withCredentials: true });
    }

    refinePrototype(projectId: string, screenId: string, message: string): Observable<{ event: string; message?: string; refinedHtml?: string }> {
        return new Observable(observer => {
            fetch(`/api/projects/${projectId}/screens/${screenId}/refine`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
                credentials: 'include',
            }).then(async response => {
                if (!response.ok) {
                    observer.error(new Error(`HTTP ${response.status}`));
                    return;
                }
                const reader = response.body!.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() ?? '';
                    for (const line of lines) {
                        if (line.startsWith('data:')) {
                            try {
                                // SSE spec allows 'data:value' or 'data: value'
                                const raw = line.substring(5);
                                const data = JSON.parse(raw.startsWith(' ') ? raw.substring(1) : raw);
                                observer.next(data);
                            } catch { /* skip malformed */ }
                        }
                    }
                }
                observer.complete();
            }).catch(err => observer.error(err));
        });
    }
}
