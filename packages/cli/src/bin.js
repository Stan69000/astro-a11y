#!/usr/bin/env node
import { Command } from 'commander';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { scanTarget } from '@astro-a11y/core';
import { renderByFormat } from '@astro-a11y/reporters';
import { writeOutput } from './output-path.js';

function shouldFail(result, threshold) {
  const order = ['info', 'minor', 'major', 'critical'];
  const thresholdIndex = order.indexOf(threshold);
  if (thresholdIndex === -1) return false;
  return Object.entries(result.summary.issuesBySeverity).some(
    ([severity, count]) => count > 0 && order.indexOf(severity) >= thresholdIndex
  );
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
  .option('-f, --format <format>', 'Output format: terminal|json|html|markdown', 'terminal')
  .option('--output-format <format>', 'Alias for --format')
  .option('-o, --output <path>', 'Output file path')
  .option('--allow-unsafe-targets', 'Allow scanning localhost/private remote targets')
  .option('--allowed-domains <domains>', 'Comma-separated domain allowlist for remote targets', (val) =>
    val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )
  .option('--max-redirects <count>', 'Maximum number of followed redirects for remote scans', '3')
  .option('--block-sensitive-ports', 'Block remote targets using sensitive ports')
  .option('--fail-on <severity>', 'Fail on: critical|major|minor|info', (val) => {
    const valid = ['critical', 'major', 'minor', 'info'];
    return valid.includes(val) ? val : '';
  })
  .option('--timeout <ms>', 'Page load timeout in milliseconds', '15000')
  .option('--safe-report', 'Strip raw HTML snippets from rendered reports')
  .option('--max-field-length <chars>', 'Maximum report field length before truncation', '5000')
  .option('--progress', 'Show progress indicator for multi-page scans')
  .option('--include-tags <tags>', 'Comma-separated axe tag names to include (e.g. wcag2a,wcag2aa)', (val) =>
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
  .action(async (target, options) => {
    const mode = options.mode ?? 'balanced';
    const paranoidMode = mode === 'paranoid';
    const failOn = options.mode === 'strict' ? 'major' : options.failOn;
    const timeout = paranoidMode ? 8000 : parseInt(options.timeout, 10);
    const maxRedirects = paranoidMode ? 0 : parseInt(options.maxRedirects, 10);
    const maxFieldLength = parseInt(options.maxFieldLength, 10);
    if (isNaN(timeout) || timeout <= 0) {
      process.stderr.write(`Error: --timeout must be a positive number, got: ${options.timeout}\n`);
      process.exit(1);
    }
    if (isNaN(maxRedirects) || maxRedirects < 0) {
      process.stderr.write(`Error: --max-redirects must be a non-negative number, got: ${options.maxRedirects}\n`);
      process.exit(1);
    }
    if (isNaN(maxFieldLength) || maxFieldLength <= 0) {
      process.stderr.write(`Error: --max-field-length must be a positive number, got: ${options.maxFieldLength}\n`);
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
    const result = await scanTarget(target, {
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
    const format = options.outputFormat ?? options.format;
    const rendered = renderByFormat(result, format, {
      safeReport: paranoidMode ? true : options.safeReport,
      maxFieldLength
    });

    if (options.output) {
      await writeOutput(options.output, rendered);
    } else {
      process.stdout.write(rendered + '\n');
    }

    if (failOn && shouldFail(result, failOn)) {
      process.exit(1);
    }
  });

program
  .command('report')
  .description('Generate a report from a previous scan JSON output')
  .option('-i, --input <path>', 'Input JSON file path (required)')
  .option('-f, --format <format>', 'Output format: terminal|json|html|markdown', 'html')
  .option('--output-format <format>', 'Alias for --format')
  .option('-o, --output <path>', 'Output file path')
  .option('--safe-report', 'Strip raw HTML snippets from rendered reports')
  .option('--max-field-length <chars>', 'Maximum report field length before truncation', '5000')
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
      process.stderr.write(`Error: --max-field-length must be a positive number, got: ${options.maxFieldLength}\n`);
      process.exit(1);
    }
    const rendered = renderByFormat(result, format, {
      safeReport: options.safeReport,
      maxFieldLength
    });

    if (options.output) {
      await writeOutput(options.output, rendered);
    } else {
      process.stdout.write(rendered + '\n');
    }
  });

program.parse();
