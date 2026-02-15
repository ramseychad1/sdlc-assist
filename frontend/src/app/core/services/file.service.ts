import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscriber } from 'rxjs';
import { ProjectFile, AiAnalysisResponse } from '../models/file.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class FileService {
    constructor(private http: HttpClient) {}

    upload(projectId: string, files: File[]): Observable<ProjectFile[]> {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        return this.http.post<ProjectFile[]>(
            `${environment.apiUrl}/projects/${projectId}/files`,
            formData,
            { withCredentials: true }
        );
    }

    getByProject(projectId: string): Observable<ProjectFile[]> {
        return this.http.get<ProjectFile[]>(
            `${environment.apiUrl}/projects/${projectId}/files`,
            { withCredentials: true }
        );
    }

    delete(projectId: string, fileId: string): Observable<void> {
        return this.http.delete<void>(
            `${environment.apiUrl}/projects/${projectId}/files/${fileId}`,
            { withCredentials: true }
        );
    }

    analyze(projectId: string): Observable<AiAnalysisResponse> {
        return this.http.post<AiAnalysisResponse>(
            `${environment.apiUrl}/projects/${projectId}/analyze`,
            {},
            { withCredentials: true }
        );
    }

    analyzeStream(projectId: string): Observable<string> {
        return new Observable((subscriber: Subscriber<string>) => {
            const url = `${environment.apiUrl}/projects/${projectId}/analyze/stream`;
            const eventSource = new EventSource(url, { withCredentials: true });

            eventSource.addEventListener('delta', (event: MessageEvent) => {
                subscriber.next(event.data);
            });

            eventSource.addEventListener('done', () => {
                eventSource.close();
                subscriber.complete();
            });

            eventSource.addEventListener('error', (event: MessageEvent) => {
                eventSource.close();
                subscriber.error(new Error(event.data || 'Stream error'));
            });

            eventSource.onerror = () => {
                if (eventSource.readyState === EventSource.CLOSED || eventSource.readyState === EventSource.CONNECTING) {
                    eventSource.close();
                    subscriber.error(new Error('Connection lost'));
                }
            };

            return () => {
                eventSource.close();
            };
        });
    }
}
