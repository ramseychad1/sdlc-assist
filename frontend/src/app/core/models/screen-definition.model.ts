export type ScreenType =
  | 'dashboard'
  | 'list'
  | 'detail'
  | 'form'
  | 'modal'
  | 'settings'
  | 'auth'
  | 'report'
  | 'wizard'
  | 'empty';

export interface ScreenDefinition {
  id: string;
  projectId?: string;
  name: string;
  description: string;
  screenType: ScreenType;
  epicName: string;
  complexity: 'low' | 'medium' | 'high';
  userRole?: string;
  notes?: string;
  prototypeContent?: string;
  displayOrder?: number;
  createdAt?: string;
  prototypeGeneratedAt?: string;
}
