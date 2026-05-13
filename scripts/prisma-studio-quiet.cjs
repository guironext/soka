/**
 * Runs `npx prisma studio` and hides stderr noise from Prisma Studio 7.x when HTTP
 * clients drop the response early (see https://github.com/prisma/studio/issues/1479).
 * Does not affect the Studio UI or database access.
 *
 * Prefer `npm run db:studio` instead of plain `npx prisma studio` if you want this filtering.
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

let suppressPipeClosedBlock = false;

/** Prisma Studio 7.x may log one or two variants; first line is not always prefixed. */
function isPipeClosedNoiseStart(line) {
  return (
    line.includes("ERR_STREAM_UNABLE_TO_PIPE") ||
    line.includes("Cannot pipe to a closed or destroyed stream")
  );
}

const rl = readline.createInterface({
  input: child.stderr,
  crlfDelay: Infinity,
});

rl.on("line", (line) => {
  if (!suppressPipeClosedBlock && isPipeClosedNoiseStart(line)) {
    suppressPipeClosedBlock = true;
    return;
  }
  if (suppressPipeClosedBlock) {
    if (line.trim() === "}") {
      suppressPipeClosedBlock = false;
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
