export enum Language {
  EN = 'en',
  ZH = 'zh'
}

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark'
}

export interface FlowerTheme {
  id: string;
  nameEn: string;
  nameZh: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string; // Light mode bg
  darkBgColor: string; // Dark mode bg
}

export interface AppState {
  language: Language;
  themeMode: ThemeMode;
  currentFlowerId: string;
  health: number;
  mana: number;
  experience: number;
  level: number;
  apiKeys: {
    openai: string;
    gemini: string;
    anthropic: string;
    xai: string;
  };
}

export interface PipelineStep {
  agentId: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  output?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}