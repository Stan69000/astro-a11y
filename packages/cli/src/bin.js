#!/usr/bin/env node
import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  applyBaseline,
  createBaseline,
  installChromium,
  parseBaseline,
  scanTarget,
  SEVERITY_ORDER,
  SCAN_MODES,
  isSeverity,
  isScanMode,
  resolveFailThreshold,
  hasIssuesAtOrAbove
} from '@astro-a11y/core';
import { renderByFormat } from '@astro-a11y/reporters';
import { writeOutput } from './output-path.js';

function exitWithError(message) {
  process.stderr.write(`Error: ${message}\n`);
  process.exit(1);
}

const program = new Command();

program
  .name('astro-a11y')
  .description('Accessibility guardrails for Astro projects.')
  .version('0.1.0');

program
  .command('check')
  .description('Scan a local directory or remote URL for accessibility issues')
  .argument('<target>', 'Local directory path or remote URL')
  .option('--mode <mode>', 'Scan mode: strict|balanced|learning|paranoid', 'balanced')
  .option('-f, --format <format>', 'Output format: terminal|json|html|markdown|github', 'terminal')
  .option('--output-format <format>', 'Alias for --format')
  .option('-o, --output <path>', 'Output file path')
  .option('--allow-unsafe-targets', 'Allow scanning localhost/private remote targets')
  .option(
    '--allowed-domains <domains>',
    'Comma-separated domain allowlist for remote targets',
    (val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
  )
  .option('--max-redirects <count>', 'Maximum number of followed redirects for remote scans', '3')
  .option('--block-sensitive-ports', 'Block remote targets using sensitive ports')
  .option(
    '--fail-on <severity>',
    'Exit with code 1 when issues at or above this severity are found: critical|major|minor|info'
  )
  .option('--timeout <ms>', 'Page load timeout in milliseconds', '15000')
  .option('--safe-report', 'Strip raw HTML snippets from rendered reports')
  .option('--max-field-length <chars>', 'Maximum report field length before truncation', '5000')
  .option('--report-url <url>', 'Link to the full report, shown by the github format')
  .option('--progress', 'Show progress indicator for multi-page scans')
  .option(
    '--include-tags <tags>',
    'Comma-separated axe tag names to include (e.g. wcag2a,wcag2aa)',
    (val) =>
      val
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
  )
  .option('--exclude-rules <rules>', 'Comma-separated axe rule IDs to exclude', (val) =>
    val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )
  .option(
    '--baseline <file>',
    'Known issues file: only issues missing from it count as new and can fail the run'
  )
  .option('--write-baseline <file>', 'Write the issues found by this scan to a baseline file')
  .action(async (target, options) => {
    const mode = options.mode ?? 'balanced';
    if (!isScanMode(mode)) {
      exitWithError(`--mode must be one of ${SCAN_MODES.join('|')}, got: ${mode}`);
    }
    if (options.failOn !== undefined && !isSeverity(options.failOn)) {
      exitWithError(`--fail-on must be one of ${SEVERITY_ORDER.join('|')}, got: ${options.failOn}`);
    }
    const paranoidMode = mode === 'paranoid';
    const failThreshold = resolveFailThreshold({ mode, failOn: options.failOn });
    const timeout = paranoidMode ? 8000 : parseInt(options.timeout, 10);
    const maxRedirects = paranoidMode ? 0 : parseInt(options.maxRedirects, 10);
    const maxFieldLength = parseInt(options.maxFieldLength, 10);
    if (isNaN(timeout) || timeout <= 0) {
      process.stderr.write(`Error: --timeout must be a positive number, got: ${options.timeout}\n`);
      process.exit(1);
    }
    if (isNaN(maxRedirects) || maxRedirects < 0) {
      process.stderr.write(
        `Error: --max-redirects must be a non-negative number, got: ${options.maxRedirects}\n`
      );
      process.exit(1);
    }
    if (isNaN(maxFieldLength) || maxFieldLength <= 0) {
      process.stderr.write(
        `Error: --max-field-length must be a positive number, got: ${options.maxFieldLength}\n`
      );
      process.exit(1);
    }
    if (paranoidMode && options.allowUnsafeTargets) {
      process.stderr.write('Error: --allow-unsafe-targets cannot be used with --mode paranoid\n');
      process.exit(1);
    }
    const onProgress = options.progress
      ? ({ current, total, route }) => {
          process.stdout.write(`\rScanning ${current}/${total}: ${route}`);
          if (current === total) process.stdout.write('\n');
        }
      : undefined;
    let baseline;
    if (options.baseline) {
      try {
        baseline = parseBaseline(await readFile(path.resolve(options.baseline), 'utf8'));
      } catch (err) {
        exitWithError(`could not read baseline ${options.baseline}: ${err.message}`);
      }
    }
    const scanResult = await scanTarget(target, {
      mode,
      allowUnsafeTargets: paranoidMode ? false : options.allowUnsafeTargets,
      allowedDomains: options.allowedDomains,
      maxRedirects,
      blockSensitivePorts: paranoidMode ? true : options.blockSensitivePorts,
      enforceSandbox: paranoidMode,
      timeout,
      onProgress,
      includeTags: options.includeTags,
      excludeRules: options.excludeRules
    });
    const result = baseline ? applyBaseline(scanResult, baseline) : scanResult;
    if (options.writeBaseline) {
      await writeOutput(
        options.writeBaseline,
        JSON.stringify(createBaseline(scanResult), null, 2) + '\n'
      );
    }
    const format = options.outputFormat ?? options.format;
    const rendered = renderByFormat(result, format, {
      safeReport: paranoidMode ? true : options.safeReport,
      maxFieldLength,
      reportUrl: options.reportUrl
    });

    if (options.output) {
      await writeOutput(options.output, rendered);
    } else {
      process.stdout.write(rendered + '\n');
    }

    if (hasIssuesAtOrAbove(result.summary, failThreshold)) {
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate a report from a previous scan JSON output')
  .option('-i, --input <path>', 'Input JSON file path (required)')
  .option('-f, --format <format>', 'Output format: terminal|json|html|markdown|github', 'html')
  .option('--output-format <format>', 'Alias for --format')
  .option('-o, --output <path>', 'Output file path')
  .option('--safe-report', 'Strip raw HTML snippets from rendered reports')
  .option('--max-field-length <chars>', 'Maximum report field length before truncation', '5000')
  .option('--report-url <url>', 'Link to the full report, shown by the github format')
  .action(async (options) => {
    if (!options.input) {
      process.stderr.write('Error: --input is required\n');
      process.exit(1);
    }
    let result;
    try {
      result = JSON.parse(await readFile(path.resolve(options.input), 'utf8'));
    } catch (err) {
      process.stderr.write(`Error: could not parse input file: ${err.message}\n`);
      process.exit(1);
    }
    const format = options.outputFormat ?? options.format;
    const maxFieldLength = parseInt(options.maxFieldLength, 10);
    if (isNaN(maxFieldLength) || maxFieldLength <= 0) {
      process.stderr.write(
        `Error: --max-field-length must be a positive number, got: ${options.maxFieldLength}\n`
      );
      process.exit(1);
    }
    const rendered = renderByFormat(result, format, {
      safeReport: options.safeReport,
      maxFieldLength,
      reportUrl: options.reportUrl
    });

    if (options.output) {
      await writeOutput(options.output, rendered);
    } else {
      process.stdout.write(rendered + '\n');
    }
  });

program
  .command('install-browser')
  .description(
    'Download the Chromium build used for scans (matches the bundled Playwright version)'
  )
  .option('--with-deps', 'Also install system dependencies (Linux, requires root)')
  .action(async (options) => {
    const code = await installChromium({ withDeps: options.withDeps === true });
    process.exit(code);
  });

program.parse();
