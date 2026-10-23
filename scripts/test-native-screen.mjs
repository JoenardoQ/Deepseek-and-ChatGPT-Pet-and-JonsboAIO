// Isolated Electron smoke: explicit runtime path; no downloads, no model calls.
import {
  mkdirSync,
  mkdtempSync,
  writeFileSync,
  existsSync,
  readFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { once } from "node:events";
import assert from "node:assert/strict";
mkdirSync(".qa", { recursive: true });
const data = mkdtempSync(resolve(".qa/native-screen-profile-"));
mkdirSync(join(data, "dsh/dsh-pet"), { recursive: true });
process.env.PET_DATA_DIR = data;
process.env.DSH_HOME = join(data, "dsh");
process.env.PET_PORT = "19460";
writeFileSync(join(data, "config.json"), JSON.stringify({ usb: false }));
process.env.DSH_PET_USE_WINDOWS_BOOTSTRAP = "0";
process.env.DSH_PET_JONSBO_ENABLED = "1";
process.env.PET_AUTOSTART = "1";
process.env.DESKTOP_PET_HEADLESS = "0";
if (!process.env.DSH_PET_ELECTRON_PATH)
  throw Error("Set DSH_PET_ELECTRON_PATH to an existing Electron executable.");
process.env.DSH_PET_SMOKE = "1";
process.env.DSH_PET_SMOKE_AFTER_MS = "4500";
process.env.DSH_PET_SMOKE_OUT = join(data, "native-pet.png");
writeFileSync(
  join(data, "dsh/dsh-pet/main-config.jsonc"),
  JSON.stringify({
    pets: [
      {
        id: "main",
        name: "ChatGPT 娘",
        size: 520,
        display: "desktop",
        balanceEnabled: false,
        whisperEnabled: false,
        workStatusEnabled: true,
        fixedEnabled: true,
        position: { corner: "bottom-right", marginX: 40, marginY: 50 },
      },
    ],
    notificationsEnabled: false,
  }),
);
writeFileSync(
  join(data, "dsh/dsh-pet/characters.json"),
  JSON.stringify({ main: "chatgpt" }),
);
const { createBridge } = await import("../dsh-pet/bridge/server.mjs");
const server = createBridge();
server.listen(19460, "127.0.0.1");
await once(server, "listening");
const post = (route, value) =>
  fetch("http://127.0.0.1:19460" + route, {
    method: "POST",
    headers: { "X-Pet-Client": "1", "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
try {
  assert.equal(
    (
      await post("/event", {
        action: "wake",
        source: "chatgpt",
        state: "thinking",
      })
    ).status,
    200,
  );
  let state;
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 250));
    state = await (await fetch("http://127.0.0.1:19460/state")).json();
    if (existsSync(process.env.DSH_PET_SMOKE_OUT)) break;
    if (state.output.desktopError) throw Error(state.output.desktopError);
    const frame = await fetch(
      "http://127.0.0.1:19460/frame.png?source=chatgpt",
    );
    if (frame.ok)
      writeFileSync(
        join(data, "screen-frame.png"),
        Buffer.from(await frame.arrayBuffer()),
      );
  }
  assert.ok(
    existsSync(process.env.DSH_PET_SMOKE_OUT),
    "Native screenshot must exist",
  );
  assert.ok(readFileSync(process.env.DSH_PET_SMOKE_OUT).length > 10000);
  assert.equal(state.characters.chatgpt, "chatgpt");
  assert.equal(state.output.usb, "disabled");
  assert.equal(state.output.worker, "stopped");
  const frame = readFileSync(join(data, "screen-frame.png"));
  assert.equal(frame.readUInt32BE(16), 480);
  assert.equal(frame.readUInt32BE(20), 480);
  assert.ok(frame.length > 10000);
  writeFileSync(".qa/native-screen-frame.png", frame);
  const rendered = JSON.parse(
    readFileSync(process.env.DSH_PET_SMOKE_OUT + ".json", "utf8"),
  );
  assert.equal(rendered.imageReady, true);
  assert.notEqual(rendered.imageVisible, "none");
  assert.equal(rendered.errorVisible, false);
  assert.equal(rendered.interactiveIgnoring, false);
  assert.equal(rendered.passthroughIgnoring, true);
  writeFileSync(
    ".qa/native-pet.png",
    readFileSync(process.env.DSH_PET_SMOKE_OUT),
  );
  writeFileSync(".qa/native-render.json", JSON.stringify(rendered, null, 2));
  writeFileSync(".qa/native-state.json", JSON.stringify(state, null, 2));
  console.log(
    "PASS: real Electron renderer + IPC + JONSBO bridge captured a 480x480 PNG; image ready and mouse passthrough verified; USB disabled.",
  );
} finally {
  await post("/pet/close", {});
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
