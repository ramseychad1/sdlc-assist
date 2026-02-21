export interface Project {
    id: string;
    name: string;
    description: string | null;
    prdContent: string | null;
    selectedTemplateId: string | null;
    designSystemContent: string | null;
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
    uxDesignStatus: 'NOT_STARTED' | 'COMPLETE' | null;
    technicalDesignStatus: 'LOCKED' | 'UNLOCKED' | 'IN_PROGRESS' | 'COMPLETE' | null;
    uxDesignCompletedAt: string | null;
    designSystemUpdatedAt: string | null;
    ownerName: string | null;
    ownerId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectRequest {
    name: string;
    description?: string;
}
