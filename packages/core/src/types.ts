export type Severity = "critical" | "major" | "minor" | "info";

export interface RgaaMapping {
  rgaa: string;
  severity: Severity;
  title: string;
  why: string;
  howToFix: string;
  before?: string;
  after?: string;
}

export interface AxeNode {
  target: string | string[];
  html?: string;
  failureSummary?: string;
}

export interface EnrichedViolation {
  id: string;
  rgaa: string;
  page: string;
  severity: Severity;
  title: string;
  why: string;
  howToFix: string;
  nodes: AxeNode[];
  help: string;
  helpUrl: string;
  mode: string;
  before?: string;
  after?: string;
}

export interface ScanResult {
  target: string;
  mode: string;
  generatedAt: string;
  issues: EnrichedViolation[];
  summary: ScanSummary;
  routes?: string[];
}

export interface ScanSummary {
  pagesScanned: number;
  issuesBySeverity: Record<Severity, number>;
  failed: boolean;
}

export interface ScanOptions {
  mode?: string;
  allowUnsafeTargets?: boolean;
  allowedDomains?: string[];
  maxRedirects?: number;
  blockSensitivePorts?: boolean;
  enforceSandbox?: boolean;
  includeTags?: string[];
  excludeRules?: string[];
  timeout?: number;
  onProgress?: (progress: ProgressInfo) => void;
}

export interface ProgressInfo {
  current: number;
  total: number;
  route: string;
}
