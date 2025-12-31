
export interface SimpleResponse {
  title: string;
  reply: string;
  rating?: 'positive' | 'negative';
}

export interface AnalysisResult {
  detectedName: string;
  summary: string;
  replies: SimpleResponse[];
}

export interface ChatSession {
  id: string; // Will use timestamp
  contactName: string;
  history: string[]; // Array of conversation summaries
  isBossMode: boolean;
  goal: 'rapport' | 'getNumber'; // The objective for this conversation
  personalContext?: string; // User-provided context for more tailored advice
  language?: 'en' | 'es'; // Primary language of the conversation
  feedbackLog?: Array<{ reply: string; rating: 'positive' | 'negative' }>;
}
