#!/usr/bin/env node
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...vals] = trimmed.split("=");
    const k = key.trim();
    const v = vals.join("=").trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[k]) {
      process.env[k] = v;
    }
  }
}

// 1. Load root .env first, then local .env.local
loadEnv(path.join(rootDir, ".env"));
loadEnv(path.join(__dirname, ".env.local"));
loadEnv(path.join(__dirname, ".env"));

// 2. Determine target port: WT_WEB_PORT > PORT > 3003
const port = process.env.WT_WEB_PORT || process.env.PORT || "3003";

console.log("\n==================================================");
console.log(`🚀 WorkTree AI Web Dashboard starting on port ${port}`);
console.log(`   URL:      http://localhost:${port}`);
console.log(`   API Base: ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005"}`);
console.log("==================================================\n");

// Check if port flag was already passed in CLI arguments
const userArgs = process.argv.slice(2);
const hasPortArg = userArgs.some((arg, i) => arg === "-p" || arg === "--port" || arg.startsWith("-p="));

const nextBin = path.join(__dirname, "node_modules", ".bin", process.platform === "win32" ? "next.cmd" : "next");
const finalArgs = ["dev", ...(hasPortArg ? [] : ["-p", port]), ...userArgs];

const child = spawn(nextBin, finalArgs, {
  stdio: "inherit",
  cwd: __dirname,
  env: process.env,
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
