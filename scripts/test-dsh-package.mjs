import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { listTarGzip, extractTarGzip } from "./archive-tools.mjs";
const source = fileURLToPath(new URL("../", import.meta.url)),
  profile = JSON.parse(
    fs.readFileSync(path.join(source, "scripts/windows-launcher.json")),
  );
const archive = path.join(
  source,
  "dist",
  profile.artifact.replace(/\.zip$/, ".tgz"),
);
const expected = fs
  .readFileSync(archive + ".sha256", "utf8")
  .trim()
  .split(/\s+/)[0];
assert.equal(
  crypto.createHash("sha256").update(fs.readFileSync(archive)).digest("hex"),
  expected,
);
const inventory = JSON.parse(fs.readFileSync(archive + ".files.json", "utf8"));
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "pet-tgz-check-"));
try {
  const entries = listTarGzip(archive);
  assert.ok(
    entries.every(
      (p) =>
        (p === "package" || p.startsWith("package/")) &&
        !/(^|\/)\.\.(\/|$)|^[a-z]:/i.test(p),
    ),
  );
  extractTarGzip(archive, workspace);
  const root = path.join(workspace, "package"),
    pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json")));
  for (const name of [
    pkg.main,
    pkg.dsh.bundle.patch,
    "scripts/install-plugins.ps1",
    "scripts/windows-launcher.ps1",
    ".codex-plugin/plugin.json",
    ".agents/plugins/marketplace.json",
  ])
    assert.ok(fs.existsSync(path.resolve(root, name)), name);
  for (const entry of inventory) {
    const file = path.join(root, entry.path);
    assert.equal(fs.statSync(file).size, entry.bytes, entry.path);
    const original = path.join(source, entry.path);
    assert.deepEqual(
      fs.readFileSync(file),
      fs.readFileSync(original),
      entry.path,
    );
  }
  assert.ok(!fs.existsSync(path.join(root, "node_modules")));
  assert.ok(!fs.existsSync(path.join(root, "bridge/local.json")));
  console.log(
    JSON.stringify({
      package: pkg.name,
      version: pkg.version,
      tarball: path.basename(archive),
      files: inventory.length,
      sha256: expected,
      downloaded: false,
      hostModified: false,
      petStarted: false,
    }),
  );
} finally {
  const resolved = fs.realpathSync(workspace),
    parent = fs.realpathSync(os.tmpdir());
  if (path.dirname(resolved) !== parent)
    throw Error("Unexpected test cleanup path");
  fs.rmSync(resolved, { recursive: true, force: true });
}
