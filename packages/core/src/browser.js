import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { chromium } from 'playwright';

const require = createRequire(import.meta.url);

/**
 * Absolute path of the Playwright CLI that ships with the `playwright`
 * version this package depends on. Using it (rather than `npx playwright`)
 * guarantees the downloaded browser matches the version that launches it.
 */
export function playwrightCliPath() {
  return path.join(path.dirname(require.resolve('playwright/package.json')), 'cli.js');
}

export function browserInstallCommand() {
  return `node "${playwrightCliPath()}" install chromium`;
}

/**
 * Downloads the Chromium build expected by the bundled Playwright.
 *
 * @param {{ withDeps?: boolean }} [options] `withDeps` also installs system libraries (Linux, needs root).
 * @returns {Promise<number>} The installer exit code.
 */
export function installChromium({ withDeps = false } = {}) {
  const args = [playwrightCliPath(), 'install', ...(withDeps ? ['--with-deps'] : []), 'chromium'];
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

/**
 * Turns Playwright's "browser not installed" failure into an actionable message.
 *
 * @param {unknown} error
 * @returns {unknown} A clearer error, or the original one when unrelated.
 */
export function explainLaunchError(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('Chromium sandboxing failed')) {
    return new Error(
      'The paranoid mode requires the Chromium sandbox, which this system cannot provide ' +
        '(running as root, or user namespaces disabled). Run as a regular user, or use another mode ' +
        'inside an isolated container.',
      { cause: error }
    );
  }
  if (!message.includes("Executable doesn't exist")) return error;
  return new Error(
    'Chromium for Playwright is not installed. Run `npx astro-a11y install-browser`, ' +
      `or: ${browserInstallCommand()}`,
    { cause: error }
  );
}

export async function launchChromium(options) {
  try {
    return await chromium.launch(options);
  } catch (error) {
    throw explainLaunchError(error);
  }
}
