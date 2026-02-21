export interface TechPreferences {
    frontend: string;
    backend: string;
    database: string;
    deployment: string;
    auth: string;
    apiStyle: string;
}

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
    // Technical Design Phase
    techPreferences: string | null;  // JSON string of TechPreferences
    techPreferencesSavedAt: string | null;
    corporateGuidelinesFilename: string | null;
    corporateGuidelinesUploadedAt: string | null;
    archOverviewContent: string | null;
    archOverviewGeneratedAt: string | null;
    dataModelContent: string | null;
    dataModelGeneratedAt: string | null;
    apiContractContent: string | null;
    apiContractGeneratedAt: string | null;
    sequenceDiagramsContent: string | null;
    sequenceDiagramsGeneratedAt: string | null;
    techDesignStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' | null;
    techDesignCompletedAt: string | null;
    ownerName: string | null;
    ownerId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ProjectRequest {
    name: string;
    description?: string;
}
