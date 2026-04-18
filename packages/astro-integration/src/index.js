import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanDirectory } from "@astro-a11y/core";
import { renderByFormat } from "@astro-a11y/reporters";

function isPageRoute(route) {
  return !route.pathname?.endsWith(".xml") && !route.pathname?.endsWith(".txt");
}

export default function astroA11y(options = {}) {
  const mode = options.mode ?? "balanced";
  const writeReports = options.writeReports ?? true;
  const outputDirName = options.outputDirName ?? "astro-a11y";
  const reportFormats = options.reportFormats ?? ["json", "html", "markdown"];
  const failOnBuild = options.failOnBuild ?? false;
  const timeout = options.timeout ?? 15000;
  const showProgress = options.showProgress ?? false;

  if (outputDirName.includes("..")) {
    throw new Error("outputDirName cannot contain '..' path traversal.");
  }

  let resolvedRoutes = [];

  return {
    name: "astro-a11y",
    hooks: {
      "astro:config:setup"({ logger }) {
        logger.info(`[astro-a11y] enabled in ${mode} mode.`);
      },

      "astro:routes:resolved"({ routes }) {
        resolvedRoutes = routes.filter(isPageRoute).map((route) => route.pathname);
      },

      async "astro:build:done"({ dir, logger }) {
        const rootDir = fileURLToPath(dir);
        const onProgress = showProgress ? ({ current, total, route }) => {
          logger.info(`Scanning ${current}/${total}: ${route}`);
        } : undefined;
        const result = await scanDirectory(rootDir, { mode, routes: resolvedRoutes, timeout, onProgress });

        logger.info(renderByFormat(result, "terminal"));

        if (writeReports) {
          const reportDir = path.join(rootDir, outputDirName);
          await mkdir(reportDir, { recursive: true });

          for (const format of reportFormats) {
            const outputPath = path.join(reportDir, `report.${format === "markdown" ? "md" : format}`);
            await writeFile(outputPath, renderByFormat(result, format), "utf8");
          }

          logger.info(`[astro-a11y] reports written to ${reportDir}`);
        }

        if (failOnBuild && result.summary.failed) {
          throw new Error("[astro-a11y] Build failed because accessibility issues were found.");
        }
      }
    }
  };
}
