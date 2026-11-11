import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  applyBaseline,
  parseBaseline,
  scanDirectory,
  SEVERITY_ORDER,
  SCAN_MODES,
  isSeverity,
  isScanMode,
  resolveFailThreshold,
  hasIssuesAtOrAbove
} from '@astro-a11y/core';
import { renderByFormat } from '@astro-a11y/reporters';
import { resolveRoutesFromAssets, selectPrerenderedPages } from './routes.js';

const REPORT_EXTENSIONS = { json: 'json', html: 'html', markdown: 'md' };

function validateOptions({ mode, failOn, outputDirName, reportFormats }) {
  if (!isScanMode(mode)) {
    throw new Error(`[astro-a11y] mode must be one of ${SCAN_MODES.join(', ')}, got: ${mode}`);
  }
  if (failOn !== undefined && !isSeverity(failOn)) {
    throw new Error(
      `[astro-a11y] failOn must be one of ${SEVERITY_ORDER.join(', ')}, got: ${failOn}`
    );
  }
  if (outputDirName.includes('..') || path.isAbsolute(outputDirName)) {
    throw new Error("[astro-a11y] outputDirName must be a relative path without '..'.");
  }
  const unknownFormats = reportFormats.filter((format) => !(format in REPORT_EXTENSIONS));
  if (unknownFormats.length > 0) {
    throw new Error(
      `[astro-a11y] unsupported reportFormats: ${unknownFormats.join(', ')}. ` +
        `Expected: ${Object.keys(REPORT_EXTENSIONS).join(', ')}.`
    );
  }
}

export default function astroA11y(options = {}) {
  const mode = options.mode ?? 'balanced';
  const writeReports = options.writeReports ?? true;
  const outputDirName = options.outputDirName ?? 'astro-a11y';
  const reportFormats = options.reportFormats ?? ['json', 'html', 'markdown'];
  const failOnBuild = options.failOnBuild ?? false;
  const failOn = options.failOn;
  const timeout = options.timeout ?? 15000;
  const showProgress = options.showProgress ?? false;
  const includeTags = options.includeTags;
  const excludeRules = options.excludeRules;
  const baselinePath = options.baseline;

  validateOptions({ mode, failOn, outputDirName, reportFormats });
  const failThreshold = resolveFailThreshold({ mode, failOn, failByDefault: failOnBuild });

  let prerenderedPages = [];
  let projectRoot = process.cwd();

  return {
    name: 'astro-a11y',
    hooks: {
      'astro:config:setup'({ config, logger }) {
        projectRoot = fileURLToPath(config.root);
        logger.info(`enabled in ${mode} mode.`);
      },

      'astro:routes:resolved'({ routes }) {
        prerenderedPages = selectPrerenderedPages(routes);
      },

      async 'astro:build:done'({ dir, assets, logger }) {
        const rootDir = fileURLToPath(dir);
        const routes = resolveRoutesFromAssets(prerenderedPages, assets, rootDir);
        if (routes.length === 0) {
          logger.warn(
            'could not resolve built pages from Astro; scanning every HTML file in the output.'
          );
        }

        const onProgress = showProgress
          ? ({ current, total, route }) => logger.info(`Scanning ${current}/${total}: ${route}`)
          : undefined;
        // Read the baseline before scanning, so a wrong path fails before the browser starts.
        const baseline = baselinePath
          ? parseBaseline(await readFile(path.resolve(projectRoot, baselinePath), 'utf8'))
          : undefined;
        const scanResult = await scanDirectory(rootDir, {
          mode,
          // An empty list makes the scanner crawl the output directory instead.
          routes,
          timeout,
          onProgress,
          includeTags,
          excludeRules
        });
        const result = baseline ? applyBaseline(scanResult, baseline) : scanResult;

        logger.info(renderByFormat(result, 'terminal'));

        if (writeReports) {
          const reportDir = path.join(rootDir, outputDirName);
          await mkdir(reportDir, { recursive: true });

          for (const format of reportFormats) {
            const outputPath = path.join(reportDir, `report.${REPORT_EXTENSIONS[format]}`);
            await writeFile(outputPath, renderByFormat(result, format), 'utf8');
          }

          logger.info(`reports written to ${reportDir}`);
        }

        if (hasIssuesAtOrAbove(result.summary, failThreshold)) {
          throw new Error(
            `[astro-a11y] Build failed: accessibility issues at or above "${failThreshold}" were found.`
          );
        }
      }
    }
  };
}
