#!/usr/bin/env node
import { Command } from 'commander';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { scanTarget } from '@astro-a11y/core';
import { renderByFormat } from '@astro-a11y/reporters';

function shouldFail(result, threshold) {
  const order = ['info', 'minor', 'major', 'critical'];
  const thresholdIndex = order.indexOf(threshold);
  if (thresholdIndex === -1) return false;
  return Object.entries(result.summary.issuesBySeverity).some(
    ([severity, count]) => count > 0 && order.indexOf(severity) >= thresholdIndex
  );
}

async function writeOutput(filePath, contents) {
  const fullPath = path.resolve(filePath);
  const cwd = process.cwd();
  if (!fullPath.startsWith(cwd + path.sep) && fullPath !== cwd) {
    throw new Error('Output path must be within current working directory.');
  }
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, contents, 'utf8');
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
  .option('--mode <mode>', 'Scan mode: strict|balanced|learning', 'balanced')
  .option('-f, --format <format>', 'Output format: terminal|json|html|markdown', 'terminal')
  .option('--output-format <format>', 'Alias for --format')
  .option('-o, --output <path>', 'Output file path')
  .option('--allow-unsafe-targets', 'Allow scanning localhost/private remote targets')
  .option('--fail-on <severity>', 'Fail on: critical|major|minor|info', (val) => {
    const valid = ['critical', 'major', 'minor', 'info'];
    return valid.includes(val) ? val : '';
  })
  .option('--timeout <ms>', 'Page load timeout in milliseconds', '15000')
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
    const failOn = options.mode === 'strict' ? 'major' : options.failOn;
    const timeout = parseInt(options.timeout, 10);
    if (isNaN(timeout) || timeout <= 0) {
      process.stderr.write(`Error: --timeout must be a positive number, got: ${options.timeout}\n`);
      process.exit(1);
    }
    const onProgress = options.progress
      ? ({ current, total, route }) => {
          process.stdout.write(`\rScanning ${current}/${total}: ${route}`);
          if (current === total) process.stdout.write('\n');
        }
      : undefined;
    const result = await scanTarget(target, {
      mode: options.mode,
      allowUnsafeTargets: options.allowUnsafeTargets,
      timeout,
      onProgress,
      includeTags: options.includeTags,
      excludeRules: options.excludeRules
    });
    const format = options.outputFormat ?? options.format;
    const rendered = renderByFormat(result, format);

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
    const rendered = renderByFormat(result, format);

    if (options.output) {
      await writeOutput(options.output, rendered);
    } else {
      process.stdout.write(rendered + '\n');
    }
  });

program.parse();
