export interface Project {
    id: string;
    name: string;
    description: string | null;
    prdContent: string | null;
    selectedTemplateId: string | null;
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
    ownerName: string | null;
    ownerId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectRequest {
    name: string;
    description?: string;
}
