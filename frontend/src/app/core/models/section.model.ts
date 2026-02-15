export interface RequirementSection {
    id: string;
    projectId: string;
    sectionType: string;
    title: string;
    content: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface SectionRequest {
    content: string;
}
