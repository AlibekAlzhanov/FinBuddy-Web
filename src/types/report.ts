export type ReportStatus = 'good' | 'normal' | 'risk' | 'critical';

export type ReportRiskLevel = 'low' | 'medium' | 'high';

export type StructuredReportItem = {
  label: string;
  value: string;
  comment?: string;
};

export type StructuredReportRisk = {
  title: string;
  level: ReportRiskLevel;
  description: string;
};

export type StructuredReportRecommendation = {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
};

export type StructuredAiReport = {
  title: string;
  period: string;
  status: ReportStatus;
  summary: string;
  keyFindings: string[];
  financialIndicators: StructuredReportItem[];
  monthComparison: StructuredReportItem[];
  categoryAnalysis: StructuredReportItem[];
  risks: StructuredReportRisk[];
  recommendations: StructuredReportRecommendation[];
  actionPlan: string[];
  conclusion: string;
};
