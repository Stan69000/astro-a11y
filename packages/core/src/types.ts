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
  /** Number of pages actually analysed, including pages without issues. */
  pagesScanned: number;
  issuesBySeverity: Record<Severity, number>;
  failed: boolean;
}

export type ScanMode = "strict" | "balanced" | "learning" | "paranoid";

export interface ScanOptions {
  mode?: ScanMode;
  allowUnsafeTargets?: boolean;
  allowedDomains?: string[];
  maxRedirects?: number;
  blockSensitivePorts?: boolean;
  enforceSandbox?: boolean;
  includeTags?: string[];
  excludeRules?: string[];
  timeout?: number;
  /** Run the keyboard checks (default: true). */
  keyboard?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
}

export interface ProgressInfo {
  current: number;
  total: number;
  route: string;
}

export interface AstroA11yOptions {
  mode?: ScanMode;
  failOnBuild?: boolean;
  failOn?: Severity;
  writeReports?: boolean;
  outputDirName?: string;
  reportFormats?: Array<"json" | "html" | "markdown">;
  includeTags?: string[];
  excludeRules?: string[];
  timeout?: number;
  showProgress?: boolean;
  keyboard?: boolean;
  baseline?: string;
}
