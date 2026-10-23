// Re-run only after intentionally replacing final art assets.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
const hash = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");
const files = [
  "chatgpt/images/core.png",
  "chatgpt/images/daily.png",
  "chatgpt/images/activity.png",
  "duo/images/scenes.png",
];
const prompts = {
  actionPlan: "art-source/action-plan.json",
  duo: "art-source/duo-prompt.txt",
  cleanup: "art-source/cleanup-prompt.txt",
};
writeFileSync(
  "art-source/generation.json",
  JSON.stringify(
    {
      schema: 1,
      date: "2026-10-23",
      tool: "built-in image_gen; user-authorized Pillow/NumPy alpha cleanup",
      method:
        "Action taxonomy, per-sheet prompts, four transparent still atlases, then connected matte and clipped chroma removal. Surviving RGB pixels are unchanged. No video or GIF encoding.",
      cleanup: { script: "scripts/clean-atlases.py", report: "art-source/cleanup-report.json" },
      prompts,
      review: {
        technical:
          "32 cells checked in browser on light and dark backgrounds and in native Electron. See validation notes.",
        aesthetic:
          "White matte and colored speckles removed with a constrained alpha mask; inspected on light/dark backgrounds. Character design is unchanged. This is an engineering visual review, not a claim of user art approval.",
      },
      outputs: files.map((f) => {
        const path = "dsh-pet/assets/pets/" + f,
          b = readFileSync(path);
        return {
          path,
          sha256: hash(path),
          width: b.readUInt32BE(16),
          height: b.readUInt32BE(20),
          columns: 4,
          rows: 2,
        };
      }),
    },
    null,
    2,
  ) + "\n",
);
const upstream = ["fish", "whale"].flatMap((id) =>
  readdirSync("dsh-pet/assets/pets/" + id + "/webm")
    .filter((f) => f.endsWith(".webm"))
    .map((f) => {
      const path = "dsh-pet/assets/pets/" + id + "/webm/" + f;
      return { path, sha256: hash(path) };
    }),
);
writeFileSync(
  "art-source/upstream-media.json",
  JSON.stringify(
    {
      sourceRepository: "JoenardoQ/Deepseek-and-ChatGPT-Pet-and-JonsboAIO",
      sourceCommit: "73c2178892b4840b78e8b373f29e171872a93e24",
      files: upstream,
    },
    null,
    2,
  ) + "\n",
);
