import { chromium } from "playwright";
import { execSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const LANDING_ROOT = path.resolve(SCRIPT_DIR, "..", "..");
const MONOREPO_ROOT = path.resolve(LANDING_ROOT, "..");
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:4321";
const FPS = 12;
const TARGET_WIDTH = 560;
const HOLD_MS = 2000;
const MAX_TARGET_BYTES = 500 * 1024;
const HARD_MAX_BYTES = 1024 * 1024;
const WORK_DIR = path.join(MONOREPO_ROOT, "tmp", "gif-capture");
const TEMPLATE_ASSETS_DIR = path.join(MONOREPO_ROOT, "email-templates", "assets");
const PUBLIC_EMAIL_DIR = path.join(LANDING_ROOT, "public", "email");
const OUT_DIRS = [TEMPLATE_ASSETS_DIR, PUBLIC_EMAIL_DIR];

const jobs = [
  {
    id: "draft",
    output: "autodraft-demo.gif",
    route: "/",
    triggerSelector: "[data-draft-section]",
    captureSelector: "[data-draft-section] .compose-mockup",
    startDelayMs: 650,
    animationMs: 4800,
    clipPadding: { top: 20, right: 20, bottom: 120, left: 20 },
    cssOverrides: `
      [data-draft-section] .context-tooltip {
        display: none !important;
      }
    `,
    extraPreCapture: async () => {},
  },
  {
    id: "inbox",
    output: "inbox-categories-demo.gif",
    route: "/",
    triggerSelector: "[data-inbox-mockup]",
    captureSelector: "[data-inbox-mockup]",
    startDelayMs: 120,
    animationMs: 4700,
    clipPadding: { top: 20, right: 20, bottom: 120, left: 20 },
    cssOverrides: `
      [data-inbox-mockup] .callout,
      [data-inbox-mockup] .autodraft {
        display: none !important;
      }
      [data-inbox-mockup] .email,
      [data-inbox-mockup] .window,
      [data-inbox-mockup] .luminous-frame {
        animation: none !important;
        transition: none !important;
        transform: none !important;
        opacity: 1 !important;
      }
      [data-inbox-mockup] .email {
        opacity: var(--final-opacity) !important;
      }
      [data-inbox-mockup][data-capture-pills="off"] .pill {
        animation: none !important;
        opacity: 0 !important;
        transform: scale(0) !important;
        filter: blur(4px) !important;
      }
      [data-inbox-mockup][data-capture-pills="on"]:not(.in-view) .pill {
        animation: none !important;
        opacity: 0 !important;
        transform: scale(0) !important;
        filter: blur(4px) !important;
      }
      [data-inbox-mockup][data-capture-pills="on"]:not(.in-view) .pill-red {
        animation: none !important;
      }
      [data-inbox-mockup][data-capture-pills="on"].in-view .pill-red {
        animation:
          pillIn 0.42s cubic-bezier(0.23, 1, 0.32, 1) 0.55s forwards,
          pillGlow 0.6s ease-in-out 1.15s 1 !important;
      }
      [data-inbox-mockup][data-capture-pills="on"].in-view .pill-blue {
        animation: pillIn 0.42s cubic-bezier(0.23, 1, 0.32, 1) 1.25s forwards !important;
      }
      [data-inbox-mockup][data-capture-pills="on"].in-view .pill-amber {
        animation: pillIn 0.42s cubic-bezier(0.23, 1, 0.32, 1) 1.95s forwards !important;
      }
      [data-inbox-mockup][data-capture-pills="on"].in-view .pill-lavender {
        animation: pillIn 0.42s cubic-bezier(0.23, 1, 0.32, 1) 2.65s forwards !important;
      }
    `,
    extraPreCapture: async (page) => {
      // Keep this specific section centered for deterministic framing.
      await page.evaluate(() => {
        const el = document.querySelector("[data-inbox-mockup]");
        if (el) {
          el.style.margin = "0 auto";
          el.setAttribute("data-capture-pills", "off");
        }
      });
    },
    beforeTriggerAnimation: async (page) => {
      await page.evaluate(() => {
        const el = document.querySelector("[data-inbox-mockup]");
        if (el) {
          el.setAttribute("data-capture-pills", "on");
        }
      });
    },
  },
  {
    id: "agent",
    output: "agent-chat-demo.gif",
    route: "/",
    triggerSelector: "[data-agent-section]",
    captureSelector: "[data-agent-section] .chat-mockup",
    startDelayMs: 720,
    animationMs: 5000,
    clipPadding: { top: 20, right: 20, bottom: 120, left: 20 },
    extraPreCapture: async () => {},
  },
];

function sh(command) {
  execSync(command, { stdio: "pipe" });
}

function fileSizeBytes(filePath) {
  return fs.statSync(filePath).size;
}

function formatKB(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

async function ensureCleanDir(dirPath) {
  await fsp.rm(dirPath, { recursive: true, force: true });
  await fsp.mkdir(dirPath, { recursive: true });
}

function chooseOptimizationPlan(inputGif, outputGif) {
  const plans = [
    { lossy: 0, colors: 256 },
    { lossy: 5, colors: 256 },
    { lossy: 10, colors: 256 },
    { lossy: 15, colors: 256 },
    { lossy: 20, colors: 256 },
    { lossy: 15, colors: 224 },
    { lossy: 20, colors: 224 },
    { lossy: 25, colors: 224 },
    { lossy: 30, colors: 192 },
    { lossy: 40, colors: 160 },
    { lossy: 50, colors: 128 },
  ];

  let best = null;
  for (const plan of plans) {
    const cmd = `gifsicle -O3 --lossy=${plan.lossy} --colors ${plan.colors} "${inputGif}" -o "${outputGif}"`;
    sh(cmd);
    const size = fileSizeBytes(outputGif);

    if (!best || size < best.size) {
      best = { ...plan, size };
    }

    if (size <= MAX_TARGET_BYTES) {
      return { ...plan, size, metTarget: true };
    }
    if (size <= HARD_MAX_BYTES) {
      // Keep searching for target, but track as acceptable fallback.
    }
  }

  return {
    ...best,
    metTarget: best.size <= MAX_TARGET_BYTES,
  };
}

async function captureFrames(page, job) {
  const jobDir = path.join(WORK_DIR, job.id);
  const framesDir = path.join(jobDir, "frames");
  await ensureCleanDir(jobDir);
  await ensureCleanDir(framesDir);

  await page.goto(`${BASE_URL}${job.route}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  await page.waitForTimeout(500);

  // Force pure white background for email-safe appearance.
  await page.addStyleTag({
    content: `
      html, body {
        background: #ffffff !important;
      }
      html {
        zoom: 1 !important;
      }
      @supports not (zoom: 1) {
        html {
          transform: none !important;
          width: auto !important;
          height: auto !important;
        }
      }
    `,
  });

  if (job.cssOverrides) {
    await page.addStyleTag({ content: job.cssOverrides });
  }

  await page.waitForSelector(job.triggerSelector, { state: "visible", timeout: 20_000 });
  await page.waitForSelector(job.captureSelector, { state: "visible", timeout: 20_000 });

  const trigger = page.locator(job.triggerSelector).first();
  const capture = page.locator(job.captureSelector).first();

  await trigger.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);

  await job.extraPreCapture(page);

  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.classList.remove("in-view");
  }, job.triggerSelector);

  await page.waitForTimeout(80);

  if (job.beforeTriggerAnimation) {
    await job.beforeTriggerAnimation(page);
    await page.waitForTimeout(30);
  }

  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.classList.add("in-view");
  }, job.triggerSelector);

  await page.waitForTimeout(job.startDelayMs);

  const box = await capture.boundingBox();
  if (!box) {
    throw new Error(`Unable to get bounding box for ${job.captureSelector}`);
  }

  const pad = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
    ...(job.clipPadding || {}),
  };
  const clip = {
    x: Math.max(0, Math.floor(box.x - pad.left)),
    y: Math.max(0, Math.floor(box.y - pad.top)),
    width: Math.ceil(box.width + pad.left + pad.right),
    height: Math.ceil(box.height + pad.top + pad.bottom),
  };

  const frameMs = Math.round(1000 / FPS);
  const animFrames = Math.max(1, Math.round(job.animationMs / frameMs));
  const holdFrames = Math.max(1, Math.round(HOLD_MS / frameMs));

  let frameIndex = 1;
  for (let i = 0; i < animFrames; i += 1) {
    const framePath = path.join(framesDir, `frame-${String(frameIndex).padStart(4, "0")}.png`);
    await page.screenshot({ path: framePath, clip });
    frameIndex += 1;
    if (i < animFrames - 1) {
      await page.waitForTimeout(frameMs);
    }
  }

  const lastFrame = path.join(framesDir, `frame-${String(frameIndex - 1).padStart(4, "0")}.png`);
  for (let i = 0; i < holdFrames; i += 1) {
    const framePath = path.join(framesDir, `frame-${String(frameIndex).padStart(4, "0")}.png`);
    await fsp.copyFile(lastFrame, framePath);
    frameIndex += 1;
  }

  const totalFrames = frameIndex - 1;
  return { jobDir, framesDir, totalFrames };
}

function encodeGif(job, framesDir, outputPath) {
  const palettePath = path.join(path.dirname(outputPath), `${job.id}-palette.png`);
  const rawGifPath = path.join(path.dirname(outputPath), `${job.id}-raw.gif`);

  const paletteCmd = [
    "ffmpeg -y",
    `-framerate ${FPS}`,
    `-i \"${framesDir}/frame-%04d.png\"`,
    `-vf \"fps=${FPS},scale=${TARGET_WIDTH}:-1:flags=lanczos,format=rgb24,palettegen=max_colors=256:stats_mode=full\"`,
    "-frames:v 1",
    `\"${palettePath}\"`,
  ].join(" ");

  const rawGifCmd = [
    "ffmpeg -y",
    `-framerate ${FPS}`,
    `-i \"${framesDir}/frame-%04d.png\"`,
    `-i \"${palettePath}\"`,
    `-filter_complex \"fps=${FPS},scale=${TARGET_WIDTH}:-1:flags=lanczos,unsharp=5:5:0.7:5:5:0,format=rgb24[x];[x][1:v]paletteuse=dither=none\"`,
    "-loop 0",
    `\"${rawGifPath}\"`,
  ].join(" ");

  sh(paletteCmd);
  sh(rawGifCmd);

  const optimization = chooseOptimizationPlan(rawGifPath, outputPath);

  fs.rmSync(palettePath, { force: true });
  fs.rmSync(rawGifPath, { force: true });

  return optimization;
}

async function main() {
  await fsp.mkdir(WORK_DIR, { recursive: true });
  for (const dir of OUT_DIRS) {
    await fsp.mkdir(dir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1800 } });

  await page.addInitScript(() => {
    class NoopIntersectionObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    // @ts-ignore
    window.IntersectionObserver = NoopIntersectionObserver;
  });

  const results = [];

  for (const job of jobs) {
    const { framesDir, totalFrames } = await captureFrames(page, job);
    const primaryOutputPath = path.join(TEMPLATE_ASSETS_DIR, job.output);
    const optimization = encodeGif(job, framesDir, primaryOutputPath);
    const size = fileSizeBytes(primaryOutputPath);

    // Mirror artifacts to duet-landing/public/email for direct hosting at /email/*.gif.
    const mirroredPaths = [];
    for (const outDir of OUT_DIRS) {
      const outPath = path.join(outDir, job.output);
      if (outPath !== primaryOutputPath) {
        await fsp.copyFile(primaryOutputPath, outPath);
      }
      mirroredPaths.push(outPath);
    }

    results.push({
      id: job.id,
      output: primaryOutputPath,
      mirroredPaths,
      totalFrames,
      size,
      optimization,
    });
  }

  await browser.close();

  for (const result of results) {
    const status = result.size <= MAX_TARGET_BYTES
      ? "target-met"
      : result.size <= HARD_MAX_BYTES
        ? "under-hard-max"
        : "over-hard-max";

    console.log(
      `${result.id}: ${result.output} | ${formatKB(result.size)} | frames=${result.totalFrames} | ` +
      `lossy=${result.optimization.lossy} colors=${result.optimization.colors} | ${status}\n` +
      `  mirrored: ${result.mirroredPaths.join(", ")}`,
    );
  }

  const hardViolations = results.filter((r) => r.size > HARD_MAX_BYTES);
  if (hardViolations.length > 0) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
