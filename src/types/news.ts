export type Verdict = "Real" | "Fake" | "Suspicious";

export type IndicatorCategory =
  | "Sensational Headline"
  | "Misleading Statement"
  | "Unverified Claim"
  | "Missing Credible Sources"
  | "Emotional Exaggeration"
  | "Internal Contradiction";

export interface SuspicionIndicator {
  category: IndicatorCategory;
  present: boolean;
  severity: "low" | "medium" | "high";
  detail: string;
}

export interface SuspiciousSentence {
  sentence: string;
  reason: string;
  indicatorType: string;
}

export interface KeywordItem {
  term: string;
  relevance: "high" | "medium";
  note: string;
}

export interface AnalysisReport {
  id: string;
  title: string;
  text: string;
  sourceUrl?: string;
  sourceDomain?: string;
  verdict: Verdict;
  confidence: number;
  realScore: number;
  fakeScore: number;
  summaryExplanation: string;
  indicators: SuspicionIndicator[];
  suspiciousSentences: SuspiciousSentence[];
  keywords: KeywordItem[];
  analyzedAt: string;
  analysisMode: "gemini-ai" | "local-heuristic-demo";
}

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: "User" | "Admin";
  createdAt: string;
}

export interface AdminSampleUser {
  id: string;
  name: string;
  email: string;
  role: "Analyst" | "Member" | "Admin";
  status: "Active" | "Suspended";
  analysesCount: number;
  joinedDate: string;
}

export interface SampleActivity {
  id: string;
  userName: string;
  articleTitle: string;
  sourceType: "Text" | "URL";
  verdict: Verdict;
  confidence: number;
  status: "Reviewed" | "Pending" | "Flagged";
  timestamp: string;
}

export type PageRoute =
  | "home"
  | "detect"
  | "history"
  | "dashboard"
  | "admin"
  | "about"
  | "login"
  | "register";
