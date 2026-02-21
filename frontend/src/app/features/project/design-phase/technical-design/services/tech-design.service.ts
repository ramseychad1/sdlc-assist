import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface SseProgressEvent {
  event: string;
  progress: number;
  message: string;
  content?: string;
}

@Injectable({ providedIn: 'root' })
export class TechDesignService {

  /**
   * Generate a technical design artifact via POST SSE.
   * The endpoint is a POST that streams SSE events.
   * Uses fetch() + ReadableStream since EventSource only supports GET.
   */
  generateArtifact(
    projectId: string,
    artifactType: 'architecture' | 'data-model' | 'api-contract' | 'sequence-diagrams'
  ): Observable<SseProgressEvent> {
    return new Observable(observer => {
      fetch(`/api/projects/${projectId}/tech-design/${artifactType}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
                const raw = line.substring(5);
                const data = JSON.parse(raw.startsWith(' ') ? raw.substring(1) : raw);
                observer.next(data as SseProgressEvent);
              } catch { /* skip malformed */ }
            }
          }
        }
        observer.complete();
      }).catch(err => observer.error(err));
    });
  }
}
