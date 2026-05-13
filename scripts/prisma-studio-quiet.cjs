/**
 * Runs `prisma studio` and hides stderr spam from Prisma Studio 7.x when HTTP
 * clients drop the response early (see https://github.com/prisma/studio/issues/1479).
 * Does not affect the Studio UI or database access.
 */
const { spawn } = require("node:child_process");
const path = require("node:path");
const readline = require("node:readline");

const root = path.join(__dirname, "..");
const studioArgs = process.argv.slice(2);

const child = spawn("npx", ["prisma", "studio", ...studioArgs], {
  cwd: root,
  stdio: ["inherit", "inherit", "pipe"],
  shell: true,
  env: process.env,
});

let suppressPrismaStudioPipeBlock = false;

const rl = readline.createInterface({
  input: child.stderr,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  if (
    line.includes("[Prisma Studio]") &&
    line.includes("ERR_STREAM_UNABLE_TO_PIPE")
  ) {
    suppressPrismaStudioPipeBlock = true;
    return;
  }
  if (suppressPrismaStudioPipeBlock) {
    if (line.trim() === "}") {
      suppressPrismaStudioPipeBlock = false;
    }
    return;
  }
  process.stderr.write(`${line}\n`);
});

child.on("error", (err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code === null ? 0 : code);
});
