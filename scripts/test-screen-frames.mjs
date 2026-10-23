// Real Chromium renderer -> production JONSBO compositor -> HTTP bridge -> PNG.
// USB is explicitly disabled; this checks the complete software frame boundary.
import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { resolve, join } from "node:path";
const root = resolve(import.meta.dirname, "..");
const out = join(root, ".qa/screen-frames");
mkdirSync(out, { recursive: true });
process.env.PET_DATA_DIR = mkdtempSync(join(out, "profile-"));
writeFileSync(join(process.env.PET_DATA_DIR, "config.json"), '{"usb":false}');
const { createBridge } = await import("../dsh-pet/bridge/server.mjs");
const bridge = createBridge({ launch: false });
bridge.listen(0, "127.0.0.1");
await once(bridge, "listening");
const base = "http://127.0.0.1:" + bridge.address().port;
const post = (route, value) =>
  fetch(base + route, {
    method: "POST",
    headers: { "X-Pet-Client": "1", "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
await post("/event", {
  source: "chatgpt",
  action: "wake",
  desktop: true,
  screen: false,
});
const actions = JSON.parse(
  readFileSync(join(root, "dsh-pet/assets/pets/chatgpt/pet.json")),
).actions;
const scenes = JSON.parse(
  readFileSync(join(root, "dsh-pet/assets/pets/duo/actions.json")),
);
const entries = [
  ...actions.map((a) => ({
    ...a,
    role: "chatgpt",
    name: "__pack-chatgpt-" + a.id,
  })),
  ...scenes.map((a) => ({ ...a, role: "duo", name: "__duet-" + a.id })),
];
const files = new Map(
  entries.map((a) => [
    "/" + a.role + "/" + a.file,
    join(root, "dsh-pet/assets/pets", a.role, a.file),
  ]),
);
for (const name of ["shared-core.js", "jonsbo-renderer.js"])
  files.set("/" + name, join(root, "dsh-pet/runtime/electron-helper", name));
const server = http.createServer((req, res) => {
  const file = files.get(req.url);
  if (!file) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader(
    "Content-Type",
    file.endsWith(".png") ? "image/png" : "text/javascript; charset=utf-8",
  );
  res.end(readFileSync(file));
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
const require = createRequire(
  new URL("../dsh-pet/package.json", import.meta.url),
);
const { chromium } = require("playwright");
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PET_TEST_BROWSER
    ? { executablePath: process.env.PET_TEST_BROWSER }
    : {}),
});
const errors = [],
  results = [];
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.exposeFunction("sendPresence", async ({ petId, ...payload }) => {
    const response = await post("/presence", {
      source: "chatgpt",
      instanceId: "frames-test",
      build: "1.2.0",
      desktop: true,
      ...payload,
    });
    assert.equal(response.status, 200);
    // Demand is normally renewed by the preview page.
    await fetch(base + "/frame.png?source=chatgpt:frames-test");
    return response.json();
  });
  await page.exposeFunction("sendFrame", async (payload) => {
    const reply = await post("/frame", {
      ...payload,
      source: "chatgpt",
      instanceId: "frames-test",
    });
    assert.equal(reply.status, 200);
    return { source: "chatgpt" };
  });
  await page.goto(
    "http://127.0.0.1:" + server.address().port + "/shared-core.js",
  );
  await page.setContent(
    '<html><head><meta charset="utf-8"></head><body><div id="stage"></div></body></html>',
  );
  await page.addScriptTag({ url: "/shared-core.js" });
  await page.evaluate(() => {
    window.S = window.PetShared;
    const imagePlayer = new S.ImagePosePlayer(document.getElementById("stage"));
    window.sprites = [
      {
        pet: { id: "frames-test", name: "ChatGPT 娘" },
        applyDuet() {},
        onWorkTick() {},
        imagePlayer,
        character: "chatgpt",
        anim: "",
        videoA: document.createElement("video"),
        videoB: document.createElement("video"),
      },
    ];
    window.jonsboBridge = {
      presence: (payload) => window.sendPresence(payload),
      frame: async (payload) => {
        const reply = await window.sendFrame(payload);
        window.lastFrame = payload;
        return reply;
      },
    };
  });
  await page.addScriptTag({ url: "/jonsbo-renderer.js" });
  for (const entry of entries) {
    await page.evaluate(async (a) => {
      window.lastFrame = null;
      const p = sprites[0];
      p.anim = a.name;
      await p.imagePlayer.play(
        "/" + a.role + "/" + a.file,
        false,
        () => {},
        a.cell,
        a.durationMs,
      );
    }, entry);
    try {
      await page.waitForFunction(
        (label) => window.lastFrame?.animation === label,
        entry.role === "duo" ? "双人互动 · " + entry.label : entry.label,
        { timeout: 5000 },
      );
    } catch (e) {
      throw Error(
        entry.id +
          ": " +
          JSON.stringify(
            await page.evaluate(() => ({
              last: window.lastFrame?.animation,
              debug: window.__jonsboDebug,
              ready: sprites[0].imagePlayer.ready,
            })),
          ),
        { cause: e },
      );
    }
    const payload = await page.evaluate(() => window.lastFrame);
    const response = await fetch(base + "/frame.png?source=chatgpt");
    assert.equal(response.status, 200);
    const bytes = Buffer.from(await response.arrayBuffer());
    assert.deepEqual(bytes, Buffer.from(payload.png, "base64"));
    assert.equal(bytes.readUInt32BE(16), 480);
    assert.equal(bytes.readUInt32BE(20), 480);
    // Compare the composed body against the exact production player's pixels.
    const rendered = await page.evaluate(async (png) => {
      const bmp = await createImageBitmap(
        await (await fetch("data:image/png;base64," + png)).blob(),
      );
      const c = document.createElement("canvas");
      c.width = c.height = 480;
      const ctx = c.getContext("2d");
      ctx.drawImage(bmp, 0, 0);
      bmp.close();
      const actual = ctx.getImageData(0, 151, 480, 270).data;
      ctx.clearRect(0, 0, 480, 480);
      ctx.drawImage(sprites[0].imagePlayer.canvas, 0, 0, 480, 270);
      const expected = ctx.getImageData(0, 0, 480, 270).data;
      let sampled = 0,
        mismatches = 0;
      for (let i = 0; i < expected.length; i += 4)
        if (expected[i + 3] >= 250) {
          sampled++;
          if (
            [0, 1, 2].some((k) => Math.abs(actual[i + k] - expected[i + k]) > 6)
          )
            mismatches++;
        }
      return { sampled, mismatches };
    }, payload.png);
    assert.ok(rendered.sampled > 10000, entry.id);
    assert.ok(
      rendered.mismatches / rendered.sampled < 0.001,
      entry.id + ": wrong composed pose",
    );
    writeFileSync(join(out, entry.role + "-" + entry.id + ".png"), bytes);
    results.push({
      role: entry.role,
      id: entry.id,
      ...rendered,
      bytes: bytes.length,
    });
  }
  assert.deepEqual(errors, []);
  const state = await (await fetch(base + "/state")).json();
  assert.equal(state.output.usb, "disabled");
  assert.equal(state.output.worker, "stopped");
  writeFileSync(
    join(out, "results.json"),
    JSON.stringify(
      { poses: results.length, errors, usb: state.output.usb, results },
      null,
      2,
    ),
  );
  console.log(
    "PASS: all 32 poses composed to 480x480 and retrieved byte-for-byte from the JONSBO bridge; no USB worker.",
  );
} finally {
  await browser.close();
  for (const s of [server, bridge]) {
    s.closeAllConnections();
    await new Promise((r) => s.close(r));
  }
}
