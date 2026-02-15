import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RequirementSection, SectionRequest } from '../models/section.model';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SectionService {
    constructor(private http: HttpClient) { }

    getByProject(projectId: string): Observable<RequirementSection[]> {
        return this.http.get<RequirementSection[]>(
            `${environment.apiUrl}/projects/${projectId}/sections`,
            { withCredentials: true }
        );
    }

    update(projectId: string, sectionId: string, request: SectionRequest): Observable<RequirementSection> {
        return this.http.put<RequirementSection>(
            `${environment.apiUrl}/projects/${projectId}/sections/${sectionId}`,
            request,
            { withCredentials: true }
        );
    }
}
