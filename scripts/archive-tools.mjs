import path from "node:path";
import { spawnSync } from "node:child_process";

// CI's PATH may put a Git/MSYS tar ahead of the native Windows implementation.
export function runTar(args, options = {}) {
  const command =
    process.platform === "win32"
      ? path.join(process.env.SystemRoot || "C:/Windows", "System32", "tar.exe")
      : "tar";
  const result = spawnSync(command, args, {
    windowsHide: true,
    encoding: "utf8",
    timeout: 120000,
    ...options,
  });
  if (result.status !== 0) {
    throw Error(
      `Archive command failed: ${command}; status=${result.status}; signal=${result.signal}; ${result.error?.message || result.stderr || "no diagnostic output"}`,
    );
  }
  return result.stdout;
}
