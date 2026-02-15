export interface ProjectFile {
    id: string;
    projectId: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    createdAt: string;
}

export interface AiAnalysisResponse {
    content: string;
}
