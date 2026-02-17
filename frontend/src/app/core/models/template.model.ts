export interface TemplateIndex {
  version: string;
  templates: TemplateEntry[];
}

export interface TemplateEntry {
  id: string;
  name: string;
  tag: string;
  description: string;
  thumbnail: string;
  preview: string;
  metadata: string;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  tag: string;
  description: string;
  designTokens: Record<string, string>;
  themes: {
    modes: string[];
    bases: string[];
    accents: string[];
  };
  components: string[];
  layoutPattern: string;
  componentStyle: string;
  density: string;
  colorMood: string;
  keyPatterns: string[];
  avoidPatterns: string[];
  promptHint: string;
}
