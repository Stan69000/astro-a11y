export { scanTarget, scanRemoteUrl, scanDirectory, summarizeIssues } from './scan.js';
export {
  assertAllowedRemoteTarget,
  isPrivateHost,
  isUnsafeHostname,
  resolveSafeRemoteUrl
} from './security.js';
export { enrichViolation, mapAxeToRgaa, RGAA_VERSION } from './mappings.js';
export { collectHtmlRoutesFromDirectory, htmlFileToRoute } from './routes.js';
export { startStaticServer } from './static-server.js';
export {
  SEVERITY_ORDER,
  SCAN_MODES,
  isSeverity,
  isScanMode,
  resolveFailThreshold,
  hasIssuesAtOrAbove
} from './thresholds.js';
