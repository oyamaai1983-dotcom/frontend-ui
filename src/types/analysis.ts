export type AnalysisStatus = 'idle' | 'received' | 'processing' | 'done';

export interface CriterionItem {
  id: string;
  name: string;
}

export interface CriterionEvaluation {
  criterion: string;
  comment: string;
  status?: 'met' | 'partial' | 'missed';
}

export interface AnalysisResultData {
  summary?: string;
  evaluations?: CriterionEvaluation[];
  rawText?: string;
}

export interface AnalysisHistoryItem {
  id: string;
  title: string;
  createdAt: string;
  analysisText: string;
  sourceType: 'audio' | 'text';
  criteriaNames: string[];
}
