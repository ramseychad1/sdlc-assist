import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { TemplateIndex, TemplateEntry, TemplateMetadata } from '../models/template.model';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private http = inject(HttpClient);

  // Cache the index.json after first load
  private templateIndex$: Observable<TemplateIndex> | null = null;

  /**
   * Get all available templates from index.json
   * Results are cached after first load
   */
  getTemplates(): Observable<TemplateEntry[]> {
    if (!this.templateIndex$) {
      this.templateIndex$ = this.http.get<TemplateIndex>('assets/templates/index.json').pipe(
        shareReplay(1)
      );
    }

    return this.templateIndex$.pipe(
      map(index => index.templates)
    );
  }

  /**
   * Get metadata for a specific template by ID
   * Loads the template's metadata.json file
   */
  getMetadata(templateId: string): Observable<TemplateMetadata> {
    return this.http.get<TemplateMetadata>(`assets/templates/${templateId}/metadata.json`);
  }
}
