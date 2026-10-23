var PetShared = (function(exports) {


//#region src/shared/constants.ts
const CANVAS_H = 360;
const FEET_Y = 330;
const HIT_BOX = {
	x0: 200,
	y0: 50,
	x1: 440,
	y1: 335
};
const DRAG_THRESHOLD = 5;
const PET_REF_WIDTH = 462;
const ANIMATION_EXT = ".webm";

//#endregion
//#region src/shared/pickers.ts
const pick = (pool, exclude) => {
	const entries = exclude ? pool.filter((n) => n !== exclude) : pool;
	const src = entries.length ? entries : pool;
	return src[Math.floor(Math.random() * src.length)];
};
const pickSlot = (slot, exclude) => {
	if (typeof slot === "string") return slot;
	const entries = exclude === void 0 ? slot : slot.filter((n) => n !== exclude);
	const src = entries.length ? entries : slot;
	return src[Math.floor(Math.random() * src.length)];
};
const slotIncludes = (slot, anim) => typeof slot === "string" ? slot === anim : slot.includes(anim);
const poolIncludes = (pool, anim) => pool.some((slot) => slotIncludes(slot, anim));
const isEventAnim = (events, anim) => events ? Object.values(events).some((pool) => poolIncludes(pool, anim)) : false;
const nextWorkStatusAnim = (pool, current) => {
	const idx = pool.findIndex((slot$1) => slotIncludes(slot$1, current));
	if (idx === -1) return null;
	const slot = pool[idx];
	if (!Array.isArray(slot) || slot.length <= 1) return null;
	return pickSlot(slot, current);
};
const randomBetween = (min, max) => Math.floor(min + Math.random() * (max - min));
const pickWeightedCategory = (categories, facing) => {
	const cats = categories.filter((c) => c.actions.length > 0);
	if (!cats.length) return null;
	const filtered = cats.filter((c) => !(c.noMirror && facing === "right"));
	const eligible = filtered.length ? filtered : cats;
	const totalW = eligible.reduce((s, c) => s + c.weight, 0) || 1;
	let t = Math.random() * totalW;
	for (const c of eligible) {
		t -= c.weight;
		if (t <= 0) return c;
	}
	return eligible[eligible.length - 1];
};
const rollKind = (roll, w, opts) => {
	const turn = opts?.fixed ? 0 : w.turn;
	const move = opts?.fixed ? 0 : w.move;
	const topEnd = (w.idle + turn + move) / 100;
	if (roll < w.idle / 100) return "idle";
	if (roll < (w.idle + turn) / 100) return "turn";
	if (roll < topEnd) return "move";
	return "action";
};
const pickCategoryAction = (categories, idlePool, facing, current) => {
	const cat = pickWeightedCategory(categories, facing);
	if (!cat) return {
		id: "FALLBACK",
		name: pick(idlePool, current)
	};
	return {
		id: cat.id,
		name: pick(cat.actions, current)
	};
};

//#endregion
//#region src/shared/displays.ts
const rectRight = (r) => r.x + r.width;
const rectBottom = (r) => r.y + r.height;
const boundingRect = (rects) => {
	if (rects.length === 0) return {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	let x0 = Infinity;
	let y0 = Infinity;
	let x1 = -Infinity;
	let y1 = -Infinity;
	for (const r of rects) {
		x0 = Math.min(x0, r.x);
		y0 = Math.min(y0, r.y);
		x1 = Math.max(x1, rectRight(r));
		y1 = Math.max(y1, rectBottom(r));
	}
	return {
		x: x0,
		y: y0,
		width: x1 - x0,
		height: y1 - y0
	};
};
const pointInRect = (r, x, y) => x >= r.x && x < rectRight(r) && y >= r.y && y < rectBottom(r);
const rectAtPoint = (rects, x, y) => {
	for (const r of rects) if (pointInRect(r, x, y)) return r;
	return null;
};
const indexAtPoint = (rects, x, y) => {
	for (let i = 0; i < rects.length; i++) if (pointInRect(rects[i], x, y)) return i;
	return -1;
};
const distToRectSq = (r, x, y) => {
	const dx = Math.max(r.x - x, 0, x - rectRight(r));
	const dy = Math.max(r.y - y, 0, y - rectBottom(r));
	return dx * dx + dy * dy;
};
const nearestIndex = (rects, x, y) => {
	let best = -1;
	let bestD = Infinity;
	for (let i = 0; i < rects.length; i++) {
		const d = distToRectSq(rects[i], x, y);
		if (d < bestD) {
			bestD = d;
			best = i;
		}
	}
	return best;
};
const resolveRect = (rects, x, y) => {
	const hit = rectAtPoint(rects, x, y);
	if (hit) return hit;
	const i = nearestIndex(rects, x, y);
	return i < 0 ? null : rects[i];
};
const clampPointInRect = (r, x, y) => ({
	x: Math.min(Math.max(x, r.x), rectRight(r) - 1),
	y: Math.min(Math.max(y, r.y), rectBottom(r) - 1)
});
const clampPointToRegion = (rects, x, y) => {
	if (rectAtPoint(rects, x, y)) return {
		x,
		y
	};
	const i = nearestIndex(rects, x, y);
	return i < 0 ? {
		x,
		y
	} : clampPointInRect(rects[i], x, y);
};
const regionArea = (rects) => rects.reduce((s, r) => s + r.width * r.height, 0);
const regionHoleRatio = (rects) => {
	const hull = boundingRect(rects);
	const hullArea = hull.width * hull.height;
	if (hullArea <= 0) return 0;
	return Math.max(0, 1 - regionArea(rects) / hullArea);
};
const translateRects = (rects, dx, dy) => rects.map((r) => ({
	x: r.x + dx,
	y: r.y + dy,
	width: r.width,
	height: r.height
}));

//#endregion
//#region src/shared/motion.ts
const planMove = (o) => {
	const side = o.sideAllow ?? 0;
	const distance = randomBetween(o.minDist, o.maxDist);
	const target = o.cx + o.dir * distance;
	if (o.areas && o.areas.length > 0) {
		const bodyHalf = o.halfW - side;
		if (!rectAtPoint(o.areas, target - bodyHalf - o.margin, o.cy)) return null;
		if (!rectAtPoint(o.areas, target + bodyHalf + o.margin, o.cy)) return null;
	} else {
		const leftBound = o.margin + o.halfW - side;
		const rightBound = o.W - o.margin - o.halfW + side;
		if (target < leftBound || target > rightBound) return null;
	}
	return {
		startRatio: o.cx / o.W,
		startYRatio: o.cy / o.H,
		targetRatio: target / o.W,
		totalRatio: Math.abs(target - o.cx) / o.W
	};
};
const anchorPixel = (o) => {
	const height = o.size * 9 / 16;
	const a = o.area ?? {
		x: 0,
		y: 0,
		width: o.W,
		height: o.H
	};
	const left = a.x + o.marginX;
	const top = a.y + o.marginY;
	const right = a.x + a.width - o.size - o.marginX;
	const bottom = a.y + a.height - height - o.marginY;
	switch (o.corner) {
		case "top-left": return {
			x: left,
			y: top
		};
		case "top-right": return {
			x: right,
			y: top
		};
		case "bottom-left": return {
			x: left,
			y: bottom
		};
		case "bottom-right": return {
			x: right,
			y: bottom
		};
	}
};

//#endregion
//#region src/shared/balance.ts
/**
* 可选数字：缺省 → undefined；出现但非法 → null（调用方据此整拍跳过——不把 NaN/字符串送进展示层）。
*/
function optNum(value) {
	if (value === void 0 || value === null) return void 0;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}
function toBalanceState(raw) {
	if (!raw || typeof raw !== "object") return null;
	const r = raw;
	const provider = String(r.provider ?? "unknown");
	if (r.ok !== true) {
		const reason = r.reason === "unsupported" || r.reason === "credential-missing" || r.reason === "fetch-error" ? r.reason : "fetch-error";
		return {
			provider,
			ok: false,
			reason,
			message: typeof r.message === "string" ? r.message : void 0
		};
	}
	const d = r.data;
	if (!d || typeof d !== "object") return null;
	if (r.shape === "quota") {
		if (!Array.isArray(d.windows) || !d.windows.length || d.windows.length > 64) return null;
		const windows = [];
		for (const item of d.windows) {
			if (!item || typeof item !== "object") return null;
			const w = item;
			if (typeof w.label !== "string" || typeof w.usedPercent !== "number" || !Number.isFinite(w.usedPercent) || w.usedPercent < 0 || w.usedPercent > 100 || typeof w.windowMinutes !== "number" || !Number.isFinite(w.windowMinutes) || w.windowMinutes <= 0) return null;
			windows.push({
				label: w.label,
				usedPercent: w.usedPercent,
				windowMinutes: w.windowMinutes,
				resetsAt: typeof w.resetsAt === "string" ? w.resetsAt : void 0
			});
		}
		return {
			provider,
			shape: "quota",
			ok: true,
			quotaWindows: windows,
			plan: typeof d.plan === "string" ? d.plan : void 0,
			updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : void 0
		};
	}
	if (r.shape === "windows") {
		const monthly = optNum(d.monthly);
		const rolling = optNum(d.rolling);
		const weekly = optNum(d.weekly);
		const rollingCapUsd = optNum(d.rollingCapUsd);
		const weeklyCapUsd = optNum(d.weeklyCapUsd);
		const monthlyCapUsd = optNum(d.monthlyCapUsd);
		if (monthly === void 0 || monthly === null) return null;
		if (rolling === null || weekly === null || rollingCapUsd === null || weeklyCapUsd === null || monthlyCapUsd === null) return null;
		return {
			provider,
			shape: "windows",
			ok: true,
			rolling,
			weekly,
			monthly,
			rollingCapUsd,
			weeklyCapUsd,
			monthlyCapUsd,
			rollingLabel: typeof d.rollingLabel === "string" && d.rollingLabel.length > 0 ? d.rollingLabel : void 0,
			rollingResetsAt: typeof d.rollingResetsAt === "string" ? d.rollingResetsAt : void 0,
			weeklyResetsAt: typeof d.weeklyResetsAt === "string" ? d.weeklyResetsAt : void 0,
			monthlyResetsAt: typeof d.monthlyResetsAt === "string" ? d.monthlyResetsAt : void 0
		};
	}
	if (r.shape === "money") return {
		provider,
		shape: "money",
		ok: true,
		currency: typeof d.currency === "string" ? d.currency : void 0,
		total: typeof d.total === "string" ? d.total : void 0,
		granted: typeof d.granted === "string" ? d.granted : void 0,
		toppedUp: typeof d.toppedUp === "string" ? d.toppedUp : void 0,
		fullBalance: typeof d.fullBalance === "string" ? d.fullBalance : void 0,
		tier: d.tier === "peak" || d.tier === "idle" ? d.tier : void 0
	};
	return null;
}
function balancePercent(v) {
	if (v.shape === "quota") return v.quotaWindows?.length ? Math.max(...v.quotaWindows.map((w) => w.usedPercent)) : void 0;
	if (v.shape === "money") {
		const total = Number(v.total);
		const full = Number(v.fullBalance);
		if (!Number.isFinite(total)) return void 0;
		if (!Number.isFinite(full) || full <= 0) return void 0;
		const remaining = Math.max(0, total) / full * 100;
		return Math.max(0, Math.min(100, 100 - remaining));
	}
	return Math.max(v.rolling ?? 0, v.weekly ?? 0, v.monthly ?? 0);
}
function balanceEventIndex(p) {
	if (p === 100) return 5;
	const i = Math.floor(p / 20);
	return i < 5 ? i : 4;
}
const WINDOW_LABELS = {
	weekly: "周",
	monthly: "月"
};
const DEFAULT_ROLLING_LABEL = "5h";
/** 窗口展示名：滚动窗取服务商自报值（缺省 5h），周/月走固定表 */
function windowLabel(v, w) {
	if (w === "rolling") return v.rollingLabel ?? DEFAULT_ROLLING_LABEL;
	return WINDOW_LABELS[w];
}
/** 各窗口的满额度（USD）：全部来自数据（展示层不写死任何服务商的额度） */
function windowQuotas(v) {
	return {
		rolling: v.rollingCapUsd,
		weekly: v.weeklyCapUsd,
		monthly: v.monthlyCapUsd
	};
}
function urgentWindow(v) {
	if (v.shape === "quota") {
		const w = v.quotaWindows?.reduce((a, b) => a.usedPercent >= b.usedPercent ? a : b);
		return w ? {
			label: w.label,
			percent: w.usedPercent,
			resetsAt: w.resetsAt
		} : void 0;
	}
	if (v.shape === "money") return void 0;
	const quotas = windowQuotas(v);
	const resets = {
		rolling: v.rollingResetsAt,
		weekly: v.weeklyResetsAt,
		monthly: v.monthlyResetsAt
	};
	const present = [
		"rolling",
		"weekly",
		"monthly"
	].filter((w) => v[w] !== void 0);
	if (present.length === 0) return void 0;
	const allQuotas = present.every((w) => {
		const quota = quotas[w];
		return quota !== void 0 && quota > 0;
	});
	let best;
	for (const w of present) {
		const percent = v[w] ?? 0;
		const quota = quotas[w];
		const cand = {
			label: windowLabel(v, w),
			percent,
			quotaUsd: quota,
			remainingUsd: allQuotas && quota !== void 0 ? quota * (100 - percent) / 100 : void 0,
			resetsAt: resets[w]
		};
		if (best === void 0) {
			best = cand;
			continue;
		}
		const moreUrgent = allQuotas ? (cand.remainingUsd ?? 0) < (best.remainingUsd ?? 0) : cand.percent > best.percent;
		if (moreUrgent) best = cand;
	}
	return best;
}
function resetInText(iso) {
	if (!iso) return "";
	const t = new Date(iso).getTime();
	if (!Number.isFinite(t)) return "";
	const delta = t - Date.now();
	if (delta <= 0) return "已重置";
	const hoursF = delta / 36e5;
	if (hoursF >= 96) return (Math.round(hoursF / 24 * 10) / 10).toFixed(1) + " 天";
	return Math.max(.1, Math.round(hoursF * 10) / 10).toFixed(1) + " 小时";
}
/** 不可用状态的气泡行（显式说明原因，绝不伪造数字）：
*  - unsupported：服务商未登记查询接口（配置事实，不是故障）→ 报出 provider id，便于自查"当前到底是谁"
*  - credential-missing：缺凭证 → 次要行放 host 报的凭证名（不含 message 时不留空行）
*  - fetch-error：抓取失败 → 次要行放底层错误
* 次要行为空的会被剔除：空 div 在气泡里会白占一行高度。 */
function unavailableRows(state) {
	const rows = state.reason === "unsupported" ? [{
		role: "error",
		text: "当前服务商暂不支持余额查询"
	}, {
		role: "sub",
		text: "当前服务商：" + state.provider
	}] : state.reason === "credential-missing" ? [{
		role: "error",
		text: "缺少余额查询凭证"
	}, {
		role: "sub",
		text: state.message ?? ""
	}] : [{
		role: "error",
		text: "余额查询失败"
	}, {
		role: "sub",
		text: state.message ?? ""
	}];
	return rows.filter((r) => r.text !== "");
}
function balanceBubbleView(state) {
	if (state.ok) {
		if (state.shape === "quota") {
			const rows = [{
				role: "label",
				text: "ChatGPT / Codex 套餐用量"
			}];
			for (const w of state.quotaWindows || []) {
				rows.push({
					role: "label",
					text: w.label + "剩余 " + Math.round(100 - w.usedPercent) + "%"
				});
				const reset = resetInText(w.resetsAt);
				rows.push({
					role: "sub",
					text: reset ? reset + (reset === "已重置" ? "" : "后重置") : "重置时间未知"
				});
			}
			return rows;
		}
		if (state.shape !== "money") {
			const w = urgentWindow(state);
			if (w) {
				const reset = resetInText(w.resetsAt);
				const rows = [{
					role: "label",
					text: w.label + "额度已用 " + Math.round(w.percent) + "%"
				}, {
					role: "sub",
					text: reset ? reset + "重置" : "已重置"
				}];
				return rows;
			}
			return [{
				role: "label",
				text: "额度数据不可用"
			}];
		}
		const symbol = state.currency === "USD" ? "$" : "¥";
		const amount = symbol + (state.total ?? "-");
		if (!state.tier) return [{
			role: "label",
			text: "余额 " + amount
		}];
		return [
			{
				role: "label",
				text: "余额（"
			},
			{
				role: "tier",
				tier: state.tier,
				text: state.tier === "peak" ? "峰" : "谷"
			},
			{
				role: "label",
				text: "）" + amount
			}
		];
	}
	return unavailableRows(state);
}
function decideBalanceNotice(state, lastKey, explicit) {
	if (state.ok) return {
		show: false,
		key: null
	};
	const key = state.reason + ":" + state.provider;
	return {
		show: explicit || key !== lastKey,
		key
	};
}

//#endregion
//#region package.json
var name = "dsh-pet";
var version = "1.2.0";
var description = "鲸鱼娘、圆润蓝发女仆大肥鱼与 ChatGPT 娘：共用桌宠引擎、独立角色素材、双宿主互动和乔思伯屏幕。";
var icon = "assets/logo.png";
var keywords = [
	"dsh",
	"dsh-plugin",
	"deepseek-harness",
	"desktop-pet",
	"pet",
	"floating-widget",
	"web-ui",
	"cordis",
	"react"
];
var homepage = "https://github.com/JoenardoQ/Deepseek-and-ChatGPT-Pet-and-JonsboAIO#readme";
var repository = {
	"type": "git",
	"url": "git+https://github.com/JoenardoQ/Deepseek-and-ChatGPT-Pet-and-JonsboAIO.git"
};
var bugs = { "url": "https://github.com/JoenardoQ/Deepseek-and-ChatGPT-Pet-and-JonsboAIO/issues" };
var type = "module";
var main = "lib/index.js";
var bin = { "dsh-pet-standalone": "lib/standalone.js" };
var exports$1 = {
	".": {
		"types": "./lib/types/index.d.ts",
		"default": "./lib/index.js"
	},
	"./client": {
		"types": "./lib/types/client/index.d.ts",
		"default": "./lib/client.js"
	},
	"./src/*": "./src/*",
	"./cordis.patch.yml": "./cordis.patch.yml",
	"./package.json": "./package.json"
};
var files = [
	"bridge",
	"desktop",
	"config.jonsbo.example.json",
	"JONSBO-README.md",
	"plugin.json",
	"mcp.json",
	".mcp.json",
	".codex-plugin",
	"lib",
	"src",
	"runtime/electron-helper",
	"runtime/windows-bundle.json",
	"assets/fonts",
	"assets/pic",
	"assets/config.jsonc",
	"assets/logo.png",
	"scripts/ensure-electron.mjs",
	"scripts/start-mcp.cmd",
	"cordis.patch.yml",
	"assets/pets",
	"assets/screen-backgrounds"
];
var scripts = {
	"bundle": "tsdown",
	"build:desktop-core": "node scripts/build-desktop-core.mjs",
	"watch": "tsdown --watch",
	"ensure:electron": "node scripts/ensure-electron.mjs",
	"start:desktop": "node scripts/start-desktop.mjs",
	"standalone": "node lib/standalone.js",
	"dev:mock": "node scripts/dev/mock-server.mjs",
	"build": "node ../scripts/generate-pack-index.mjs && npm run bundle && npm run build:desktop-core && npm run types",
	"prepack": "npm run build && npm run typecheck && npm run lint && npm run format:check && node scripts/prepack-check.js && npm run check:openapi",
	"check:openapi": "node scripts/check-openapi.mjs",
	"test": "node --experimental-strip-types --import ./scripts/test-register.mjs --test src/**/*.test.ts",
	"typecheck": "tsc --noEmit && tsc -p tsconfig.test.json",
	"types": "node scripts/gen-types.mjs",
	"lint": "eslint .",
	"format": "prettier --write .",
	"format:check": "prettier --check .",
	"test:ui": "node --test scripts/tests/*.test.mjs",
	"pet": "node bridge/cli.mjs",
	"prepare:jonsbo": "node scripts/prepare-jonsbo.mjs"
};
var license = "MIT";
var engines = { "node": ">=22.12.0" };
var dependencies = {
	"@electron-internal/extract-zip": "^1.0.5",
	"@electron/get": "^5.1.0"
};
var dsh = {
	"bundle": { "patch": "./cordis.patch.yml" },
	"compatibility": { "dshReleases": {
		"0.1.7-rc.2": "incompatible",
		"0.2.0-rc.1": "compatible",
		"0.2.0-rc.2": "compatible"
	} },
	"client": {
		"inject": ["@deepseek-ai/dsh-client-connection"],
		"platform": "web"
	}
};
var peerDependencies = {
	"@deepseek-ai/cordis": "^4.0.4",
	"@deepseek-ai/dsh-agent-default-model": "^0.2.0-rc.1",
	"@deepseek-ai/dsh-client-connection": "^0.2.0-rc.1",
	"@deepseek-ai/dsh-client-ui-primitives": "^0.2.0-rc.1",
	"@deepseek-ai/dsh-client-ui-slots": "^0.2.0-rc.1",
	"@deepseek-ai/dsh-commands": "^0.2.0-rc.1",
	"@deepseek-ai/dsh-credentials": "^0.2.0-rc.1",
	"@deepseek-ai/dsh-home-paths": "^0.2.0-rc.1",
	"@deepseek-ai/dsh-host-webserver": "^0.2.0-rc.1",
	"@deepseek-ai/dsh-llm": "^0.2.0-rc.1",
	"react": "^18.2.0",
	"react-dom": "^18.2.0"
};
var devDependencies = {
	"@eslint/js": "^10.0.1",
	"@types/node": "^26.2.0",
	"@types/react": "^18.2.0",
	"@types/react-dom": "^18.2.0",
	"eslint": "^10.9.0",
	"eslint-plugin-react-hooks": "^7.1.1",
	"js-yaml": "^5.4.2",
	"playwright": "1.64.1",
	"prettier": "^3.9.6",
	"react": "^18.2.0",
	"react-dom": "^18.2.0",
	"rolldown": "1.0.0-beta.7",
	"tsdown": "^0.8.0",
	"typescript": "^5.5.0",
	"typescript-eslint": "^8.67.0",
	"@deepseek-ai/cordis": "^4.0.4",
	"@deepseek-ai/dsh-client-ui-primitives": "^0.2.0-rc.1",
	"@deepseek-ai/dsh-credentials": "^0.2.0-rc.1",
	"@deepseek-ai/dsh-home-paths": "^0.2.0-rc.1",
	"@deepseek-ai/dsh-llm": "^0.2.0-rc.1",
	"globals": "^17.13.0"
};
var overrides = { "@keyv/serialize": "1.1.1" };
var package_default = {
	name,
	version,
	description,
	icon,
	keywords,
	homepage,
	repository,
	bugs,
	type,
	main,
	bin,
	exports: exports$1,
	files,
	scripts,
	license,
	engines,
	dependencies,
	dsh,
	peerDependencies,
	devDependencies,
	overrides
};

//#endregion
//#region src/shared/asset-version.ts
const ASSET_VERSION = package_default.version;
const versionedAsset = (path) => path + (path.includes("?") ? "&" : "?") + "v=" + encodeURIComponent(ASSET_VERSION);

//#endregion
//#region src/shared/whisper.ts
function whisperBubbleView(state) {
	if (state.ok) return [{
		role: "label",
		text: state.text
	}];
	const msg = state.reason === "provider-missing" ? "当前对话未配置模型，碎碎念不可用" : "碎碎念生成失败" + (state.message ? "：" + state.message : "");
	return [{
		role: "label",
		text: msg
	}];
}
function memeImageUrl(name$1, base = "/dsh-pet-7340", assetRoot = "") {
	const root = String(assetRoot ?? "").trim();
	const prefix = root ? "/pic/memes/" + encodeURIComponent(root) : "/pic/memes";
	const url = base + prefix + "/" + encodeURIComponent(name$1) + ".png";
	return ["@chatgpt", "@whale"].includes(root) ? versionedAsset(url) : url;
}
const MEME_IMG_CLASS = "pet-bub-img";
const MEME_BUBBLE_CLASS = "has-img";
const MEME_BUBBLE_CSS = [
	".pet-bub-img{display:block;width:calc(var(--dsh-pet-size,var(--pet-size,462px))*0.34);height:auto;",
	"border-radius:calc(var(--dsh-pet-size,var(--pet-size,462px))*0.026);",
	"margin:0 auto calc(var(--dsh-pet-size,var(--pet-size,462px))*0.017);object-fit:cover;",
	"pointer-events:none;user-select:none}",
	".pet-bubble.has-img,.dsh-pet-bubble.has-img{min-width:0}"
].join("");
/** 只注入一次（两端共用；页面已有同一标记则跳过） */
let memeCssInjected = false;
function injectMemeBubbleCss() {
	if (memeCssInjected || typeof document === "undefined") return;
	memeCssInjected = true;
	if (document.querySelector("style[data-plugin-css=\"dsh-pet/meme-bubble\"]") !== null) return;
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-pet";
	tag.dataset.pluginCss = "dsh-pet/meme-bubble";
	tag.textContent = MEME_BUBBLE_CSS;
	document.head.appendChild(tag);
}
function createMemeImage(name$1, base = "/dsh-pet-7340", assetRoot = "") {
	const key = String(name$1 ?? "").trim();
	if (!key) return null;
	injectMemeBubbleCss();
	const img = document.createElement("img");
	img.className = MEME_IMG_CLASS;
	img.crossOrigin = "anonymous";
	img.src = memeImageUrl(key, base, assetRoot);
	img.alt = key;
	return img;
}

//#endregion
//#region src/shared/config.ts
const PET_DISPLAYS = [
	"web",
	"desktop",
	"both",
	"none"
];
const isWebVisible = (display) => display === "web" || display === "both";
const isDesktopVisible = (display) => display === "desktop" || display === "both";
function flattenConfigPets(merged) {
	const out = [];
	for (const [entry, conf] of Object.entries(merged)) {
		const list = Array.isArray(conf?.pets) ? conf.pets : [];
		for (const p of list) out.push({
			...p,
			animations: conf.animations,
			animationWeights: conf.animationWeights,
			eventsRefreshSec: conf.eventsRefreshSec,
			physics: conf.physics,
			confineToScreen: conf.confineToScreen,
			workStatusTexts: conf.workStatusTexts,
			whisperModel: conf.whisperModel,
			chatModel: conf.chatModel,
			assetRoot: entry,
			extra: entry !== "main"
		});
	}
	return out;
}

//#endregion
//#region src/shared/notify.ts
const NOTIFY_ICONS = {
	done: "notify-done",
	error: "notify-error",
	truncated: "notify-truncated",
	approval: "notify-approval",
	question: "notify-question",
	test: "notify-test"
};
const MAX_BODY = 80;
function truncate(text) {
	return text.length > MAX_BODY ? text.slice(0, MAX_BODY) + "…" : text;
}
function frameToToast(frame) {
	switch (frame.type) {
		case "session/event": {
			const ev = frame.event ?? {};
			if (ev.type !== "turn/end") return null;
			const kind = ev.data?.reason?.kind;
			if (kind === "completed") return {
				title: "对话完成",
				body: "",
				icon: NOTIFY_ICONS.done
			};
			if (kind === "error") return {
				title: "生成失败",
				body: ev.data?.reason?.error?.message ?? "",
				icon: NOTIFY_ICONS.error
			};
			if (kind === "max-tokens") return {
				title: "输出被截断",
				body: "已达到输出 token 上限",
				icon: NOTIFY_ICONS.truncated
			};
			return null;
		}
		case "approval/requested": {
			const toolName = typeof frame.toolName === "string" ? frame.toolName : "";
			const reason = typeof frame.reason === "string" && frame.reason ? frame.reason : "";
			return {
				title: "正在申请权限",
				body: (toolName ? "工具「" + toolName + "」" : "") + (reason ? "：" + reason : ""),
				icon: NOTIFY_ICONS.approval
			};
		}
		case "question/requested": {
			const q = Array.isArray(frame.questions) && frame.questions[0]?.question || "";
			return {
				title: "模型在等你回答",
				body: q,
				icon: NOTIFY_ICONS.question
			};
		}
		case "host/agent-error": return {
			title: "生成失败",
			body: typeof frame.message === "string" ? frame.message : "",
			icon: NOTIFY_ICONS.error
		};
		default: return null;
	}
}

//#endregion
//#region src/shared/menu.ts
/** 事件名 → 分类标签（无映射时用事件名本身） */
const EVENT_LABELS = {
	balance: "余额档位",
	whisper: "碎碎念",
	workStatus: "工作状态"
};
const leaf = (anim) => ({
	label: anim,
	anim
});
function buildMenuTree(animations) {
	const groups = [];
	const pools = [
		["待机", animations.idle],
		["转向", animations.turn],
		["拖拽", animations.drag],
		["点击回应", animations.clicks],
		["移动", animations.moves.actions.map((m) => m.name)]
	];
	for (const [label$3, pool] of pools) if (pool.length) groups.push({
		label: label$3,
		children: pool.map(leaf)
	});
	const cats = (animations.categories ?? []).filter((c) => c.actions.length > 0);
	for (const c of cats) groups.push({
		label: c.id,
		children: c.actions.map(leaf)
	});
	const events = animations.events ?? {};
	for (const key of Object.keys(events)) {
		const pool = events[key] ?? [];
		const names = [];
		for (const slot of pool) if (typeof slot === "string") names.push(slot);
		else names.push(...slot);
		if (names.length) groups.push({
			label: EVENT_LABELS[key] ?? key,
			children: names.map(leaf)
		});
	}
	if (!groups.length) return [];
	return [{
		label: "动作",
		children: groups
	}];
}
function isNoMirrorAnimation(categories, anim) {
	return (categories ?? []).some((c) => c.noMirror === true && c.actions.includes(anim));
}
const MENU_CSS = [
	".dsh-pet-menu{position:fixed;left:0;top:0;z-index:2147483000;color:#2b2b2b;font-size:13px;line-height:1.5;",
	"font-family:'Microsoft YaHei UI','Segoe UI','PingFang SC',sans-serif;user-select:none;pointer-events:auto}",
	".dsh-pet-menu,.dsh-pet-menu *{box-sizing:border-box}",
	".dsh-pet-menu-column{position:absolute;min-width:150px;max-width:240px;padding:4px;",
	"background:rgba(255,255,255,.98);border:1px solid rgba(0,0,0,.12);border-radius:8px;",
	"box-shadow:0 8px 28px rgba(0,0,0,.2);max-height:min(62vh,460px);overflow-y:auto;",
	"scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.22) transparent}",
	".dsh-pet-menu-column::-webkit-scrollbar{width:8px;height:8px}",
	".dsh-pet-menu-column::-webkit-scrollbar-track{background:transparent}",
	".dsh-pet-menu-column::-webkit-scrollbar-thumb{background:rgba(0,0,0,.16);border-radius:4px;",
	"border:2px solid transparent;background-clip:content-box}",
	".dsh-pet-menu-column::-webkit-scrollbar-thumb:hover{background:rgba(43,99,255,.4);",
	"border:2px solid transparent;background-clip:content-box}",
	".dsh-pet-menu-column::-webkit-scrollbar-corner{background:transparent}",
	".dsh-pet-menu-item{position:relative;display:flex;align-items:center;justify-content:space-between;",
	"gap:14px;padding:5px 12px;border-radius:6px;white-space:nowrap;cursor:default}",
	".dsh-pet-menu-item:hover{background:rgba(43,99,255,.14)}",
	".dsh-pet-menu-item>span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis}",
	".dsh-pet-menu-arrow{color:#9aa0a6;font-size:12px;flex:none}"
].join("");
function isBranchNode(n) {
	return "children" in n && Array.isArray(n.children);
}
function mountContextMenu(opts) {
	const { tree, x, y, onAction, onClose, clamp } = opts;
	const c = clamp && Number.isFinite(clamp.x + clamp.y + clamp.w + clamp.h) ? clamp : {
		x: 0,
		y: 0,
		w: window.innerWidth,
		h: window.innerHeight
	};
	const root = document.createElement("div");
	root.className = "dsh-pet-menu";
	root.style.left = "0px";
	root.style.top = "0px";
	root.addEventListener("contextmenu", (e) => e.preventDefault());
	let closed = false;
	/** 每个面板当前展开的子面板（无 = 未展开）；hideChain 会沿链清除 */
	const openChild = new Map();
	/** 指针整体离开菜单树的兜底关闭定时器（root mouseover 重新进入即取消） */
	let leaveTimer = null;
	/** 关闭某面板及其后代面板整条链（display:none + 清 openChild 链） */
	const hideChain = (panel) => {
		panel.style.display = "none";
		const child = openChild.get(panel);
		if (child) {
			openChild.delete(panel);
			hideChain(child);
		}
	};
	/** 把面板显示在触发项旁边：右缘展开，贴右/下边缘自动翻转夹取（在 clamp 矩形内） */
	const showPanel = (panel, item) => {
		const rect = item.getBoundingClientRect();
		panel.style.left = "";
		panel.style.top = "";
		panel.style.display = "block";
		let left = rect.right + 4;
		if (left + panel.offsetWidth > c.x + c.w - 4) left = rect.left - panel.offsetWidth - 4;
		left = Math.max(c.x + 4, left);
		let top = rect.top;
		if (top + panel.offsetHeight > c.y + c.h - 4) top = Math.max(c.y + 4, c.y + c.h - 4 - panel.offsetHeight);
		panel.style.left = left + "px";
		panel.style.top = top + "px";
	};
	/** 构建一层面板（nodes 列表）；分支项的子面板**平级**挂到 root 下，不嵌套。
	*  面板自身先入 DOM、子面板随后入 → 层级越深绘制越靠上（子菜单盖在父菜单上层）。 */
	const buildPanel = (nodes) => {
		const panel = document.createElement("div");
		panel.className = "dsh-pet-menu-column";
		panel.style.display = "none";
		if (clamp) panel.style.maxHeight = Math.min(460, Math.max(120, c.h - 16)) + "px";
		root.appendChild(panel);
		for (const node of nodes) {
			const item = document.createElement("div");
			item.className = "dsh-pet-menu-item";
			if (isBranchNode(node)) {
				item.classList.add("dsh-pet-menu-branch");
				const label$3 = document.createElement("span");
				label$3.textContent = node.label;
				const arrow = document.createElement("span");
				arrow.className = "dsh-pet-menu-arrow";
				arrow.textContent = "▸";
				item.appendChild(label$3);
				item.appendChild(arrow);
				const childPanel = buildPanel(node.children);
				item.addEventListener("mouseenter", () => {
					const prev = openChild.get(panel);
					if (prev && prev !== childPanel) hideChain(prev);
					openChild.set(panel, childPanel);
					showPanel(childPanel, item);
				});
			} else {
				const label$3 = document.createElement("span");
				label$3.textContent = node.label;
				item.appendChild(label$3);
				item.addEventListener("click", (e) => {
					e.preventDefault();
					e.stopPropagation();
					close();
					onAction(node);
				});
			}
			panel.appendChild(item);
		}
		return panel;
	};
	const rootPanel = buildPanel(tree);
	rootPanel.style.display = "block";
	document.body.appendChild(root);
	rootPanel.style.left = "";
	rootPanel.style.top = "";
	const rw = rootPanel.offsetWidth;
	const rh = rootPanel.offsetHeight;
	rootPanel.style.left = Math.max(c.x + 4, Math.min(x, c.x + c.w - rw - 4)) + "px";
	rootPanel.style.top = Math.max(c.y + 4, Math.min(y, c.y + c.h - rh - 4)) + "px";
	root.addEventListener("mouseleave", () => {
		if (leaveTimer !== null) window.clearTimeout(leaveTimer);
		leaveTimer = window.setTimeout(() => {
			leaveTimer = null;
			close();
		}, 200);
	});
	root.addEventListener("mouseover", () => {
		if (leaveTimer !== null) {
			window.clearTimeout(leaveTimer);
			leaveTimer = null;
		}
	});
	const onDocPointerDown = (e) => {
		if (closed) return;
		if (root.contains(e.target)) return;
		close();
	};
	const onDocKeyDown = (e) => {
		if (closed) return;
		if (e.key === "Escape") close();
	};
	document.addEventListener("mousedown", onDocPointerDown, true);
	document.addEventListener("keydown", onDocKeyDown, true);
	const close = () => {
		if (closed) return;
		closed = true;
		if (leaveTimer !== null) window.clearTimeout(leaveTimer);
		leaveTimer = null;
		document.removeEventListener("mousedown", onDocPointerDown, true);
		document.removeEventListener("keydown", onDocKeyDown, true);
		root.remove();
		if (onClose) onClose();
	};
	return {
		el: root,
		close
	};
}

//#endregion
//#region src/shared/chat.ts
const SEND_TIMEOUT_MS = 6e4;
async function sendChat(baseUrl, text) {
	const res = await fetch(baseUrl, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ text }),
		signal: AbortSignal.timeout(SEND_TIMEOUT_MS)
	});
	const raw = await res.json().catch(() => null);
	if (!raw || typeof raw !== "object") throw new Error("dsh-pet: 对话响应非法");
	const o = raw;
	if (o.ok !== true) return {
		ok: false,
		reason: o.reason === "provider-missing" || o.reason === "generate-error" || o.reason === "config-error" ? o.reason : "bad-request",
		message: typeof o.message === "string" ? o.message : void 0
	};
	return { ok: true };
}
const CHAT_CSS = [
	".dsh-pet-chat{position:fixed;z-index:2147483001;width:160px;max-width:80vw;",
	"background:rgba(255,255,255,.98);border:1px solid rgba(0,0,0,.12);border-radius:10px;",
	"box-shadow:0 10px 32px rgba(0,0,0,.22);color:#2b2b2b;font-size:14px;line-height:1.5;",
	"font-family:'ShangshouSoftCandy','Yuanti SC','YouYuan','幼圆','Comic Sans MS','PingFang SC','Microsoft YaHei',sans-serif;",
	"user-select:none}",
	".dsh-pet-chat *{box-sizing:border-box}",
	".dsh-pet-chat-input{display:block;width:100%;border:none;outline:none;background:transparent;",
	"padding:8px 11px 9px;font-size:14px;line-height:1.45;color:#2b2b2b;font-family:inherit;",
	"resize:none;overflow:hidden;white-space:pre-wrap;overflow-wrap:anywhere}",
	".dsh-pet-chat-input::placeholder{color:rgba(43,43,43,.45)}",
	".dsh-pet-chat-input:disabled{opacity:.55}",
	".dsh-pet-chat-err{color:#d94f3d;font-size:12px;padding:0 12px 8px;white-space:pre-wrap;overflow-wrap:anywhere}"
].join("");
/** 输入框宽度自适应参数：初始小宽 → 随文本增宽 → 封顶后折行增高 */
const CHAT_MIN_W = 160;
const CHAT_MAX_W = 340;
const CHAT_H_PAD = 22;
let chatCssInjected = false;
function injectChatCss() {
	if (chatCssInjected || typeof document === "undefined") return;
	chatCssInjected = true;
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-pet";
	tag.dataset.pluginCss = "dsh-pet/chat";
	tag.textContent = CHAT_CSS;
	document.head.appendChild(tag);
}
function mountChatDialog(opts) {
	injectChatCss();
	const { petId, x, y, onSent, onClose, clamp } = opts;
	const baseUrl = opts.baseUrl ?? "/dsh-pet-7340/chat";
	const withPet = baseUrl + "?pet=" + encodeURIComponent(petId);
	const c = clamp && Number.isFinite(clamp.x + clamp.y + clamp.w + clamp.h) ? clamp : {
		x: 0,
		y: 0,
		w: window.innerWidth,
		h: window.innerHeight
	};
	const root = document.createElement("div");
	root.className = "dsh-pet-chat";
	const input = document.createElement("textarea");
	input.className = "dsh-pet-chat-input";
	input.placeholder = opts.petName ? "和" + opts.petName + "说点什么…" : "说点什么…";
	input.maxLength = 2e3;
	input.rows = 1;
	let measureCtx = null;
	const measureText = (text) => {
		const ctx = measureCtx ?? (measureCtx = document.createElement("canvas").getContext("2d"));
		ctx.font = getComputedStyle(input).font;
		return ctx.measureText(text).width;
	};
	const resizeInput = () => {
		const textW = measureText(input.value || " ");
		const w = Math.max(CHAT_MIN_W, Math.min(Math.ceil(textW + CHAT_H_PAD), CHAT_MAX_W));
		root.style.width = w + "px";
		input.style.height = "auto";
		input.style.height = Math.max(input.scrollHeight, 22) + "px";
	};
	input.addEventListener("input", resizeInput);
	resizeInput();
	const err = document.createElement("div");
	err.className = "dsh-pet-chat-err";
	err.style.display = "none";
	root.appendChild(input);
	root.appendChild(err);
	document.body.appendChild(root);
	resizeInput();
	const rr = root.getBoundingClientRect();
	root.style.left = Math.max(c.x + 4, Math.min(x, c.x + c.w - rr.width - 4)) + "px";
	root.style.top = Math.max(c.y + 4, Math.min(y, c.y + c.h - rr.height - 4)) + "px";
	let closed = false;
	let sending = false;
	const close = () => {
		if (closed) return;
		closed = true;
		document.removeEventListener("mousedown", onDocPointerDown, true);
		document.removeEventListener("keydown", onDocKeyDown, true);
		root.remove();
		if (onClose) onClose();
	};
	const onDocPointerDown = (e) => {
		if (closed) return;
		if (root.contains(e.target)) return;
		close();
	};
	const onDocKeyDown = (e) => {
		if (closed) return;
		if (e.key === "Escape") close();
	};
	document.addEventListener("mousedown", onDocPointerDown, true);
	document.addEventListener("keydown", onDocKeyDown, true);
	const doSend = () => {
		if (closed || sending) return;
		const text = input.value.trim();
		if (!text) return;
		sending = true;
		input.disabled = true;
		sendChat(withPet, text).then((state) => {
			if (state.ok) {
				close();
				if (onSent) onSent();
			} else {
				err.textContent = "对话失败：" + (state.message ?? state.reason);
				err.style.display = "block";
			}
		}).catch((e) => {
			err.textContent = "对话异常：" + String(e && e.message ? e.message : e);
			err.style.display = "block";
		}).finally(() => {
			sending = false;
			input.disabled = false;
			if (!closed) input.focus();
		});
	};
	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			doSend();
		}
	});
	input.focus();
	return {
		el: root,
		close
	};
}

//#endregion
//#region src/shared/physics.ts
const SPRING_K = 200;
const SPRING_C = 30;
const TRAIL_KEEP_MS = 200;
const RELEASE_WINDOW_MS = 150;
const RELEASE_STALE_MS = 150;
const MIN_SPAN_MS = 20;
const SEG_MIN_DT_MS = 8;
const DEAD_ZONE_SPEED = 500;
const MAX_THROW_SPEED = 3600;
const PEAK_WEIGHT = .5;
const ACCEL_REF = 8e3;
const ACCEL_GAIN_MAX = .6;
const GRAVITY = 1400;
const RESTITUTION = .78;
const GROUND_FRICTION = 2.5;
const DEFAULT_PHYSICS = {
	gravity: GRAVITY,
	restitution: RESTITUTION,
	groundFriction: GROUND_FRICTION,
	ceilingBounce: true,
	throwPower: 1,
	petCollision: false
};
const DEFAULT_THROW_POWER = 1;
const REST_VY = 40;
const REST_VX = 15;
const MAX_STEP_DT = .05;
const SQ_SQUASH = .55;
const SQ_DURATION_MS = 220;
const SQ_SOFT_SPEED = 300;
const SQ_HARD_SPEED = 1500;
const SQ_MAX_SQUASH = .55;
const landingSquash = (impactSpeed) => {
	const t = Math.min(Math.max((Math.abs(impactSpeed) - SQ_SOFT_SPEED) / (SQ_HARD_SPEED - SQ_SOFT_SPEED), 0), 1);
	return Math.min(.8, 1 - t * (1 - SQ_MAX_SQUASH));
};
const squashScale = (u, squash = SQ_SQUASH) => {
	if (u < .45) {
		const p$1 = u / .45;
		return 1 - (1 - squash) * p$1 * p$1;
	}
	const p = (u - .45) / .55;
	const c1 = 1.70158;
	const c3 = c1 + 1;
	const f = 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
	return Math.min(1.12, squash + (1 - squash) * Math.max(f, 0));
};
const throwBounds = (o) => {
	const h = o.size * 9 / 16;
	return {
		minX: -o.sideAllow,
		minY: 0,
		maxX: o.W - o.size + o.sideAllow,
		maxY: o.H - h
	};
};
const throwBoundsIn = (area, size, sideAllow) => {
	const h = size * 9 / 16;
	return {
		minX: area.x - sideAllow,
		minY: area.y,
		maxX: rectRight(area) - size + sideAllow,
		maxY: rectBottom(area) - h
	};
};
const throwSpace = (o) => ({
	bounds: o.areas.map((a) => throwBoundsIn(a, o.size, o.sideAllow)),
	areas: o.areas,
	panels: o.panels && o.panels.length === o.areas.length ? o.panels : o.areas,
	size: o.size,
	sideAllow: o.sideAllow
});
const screenOfBox = (space, x, y) => {
	const cx = x + space.size / 2;
	const cy = y + space.size * 9 / 16 / 2;
	const hit = indexAtPoint(space.areas, cx, cy);
	return hit >= 0 ? hit : nearestIndex(space.areas, cx, cy);
};
const trimTrail = (trail, now) => {
	const cutoff = now - TRAIL_KEEP_MS;
	let i = 0;
	while (i < trail.length && trail[i].t < cutoff) i++;
	return i === 0 ? trail : trail.slice(i);
};
const springStep = (v, x, target, dt, power = DEFAULT_THROW_POWER) => v + ((target - x) * SPRING_K - v * SPRING_C) * power * dt;
const softClampSpeed = (speed) => {
	if (speed <= 0) return 0;
	return MAX_THROW_SPEED * (1 - Math.exp(-speed / MAX_THROW_SPEED));
};
const estimateReleaseVelocity = (trail, now, physics = DEFAULT_PHYSICS) => {
	if (trail.length === 0) return null;
	const last = trail[trail.length - 1];
	if (now - last.t > RELEASE_STALE_MS) return null;
	const win = trail.filter((s) => now - s.t <= RELEASE_WINDOW_MS);
	if (win.length < 2) return null;
	const t0 = win[0].t;
	const x0 = win[0].x;
	const y0 = win[0].y;
	const t1 = win[win.length - 1].t;
	const x1 = win[win.length - 1].x;
	const y1 = win[win.length - 1].y;
	const spanMs = t1 - t0;
	if (spanMs < MIN_SPAN_MS) return null;
	const baseVx = (x1 - x0) / spanMs * 1e3;
	const baseVy = (y1 - y0) / spanMs * 1e3;
	const baseSpeed = Math.hypot(baseVx, baseVy);
	if (baseSpeed < 1e-6) return null;
	const segSpeeds = [];
	let px = x0;
	let py = y0;
	let pt = t0;
	for (const s of win.slice(1)) {
		const dt = s.t - pt;
		if (dt >= SEG_MIN_DT_MS) {
			segSpeeds.push({
				speed: Math.hypot(s.x - px, s.y - py) / dt * 1e3,
				tEnd: s.t
			});
			px = s.x;
			py = s.y;
			pt = s.t;
		}
	}
	const peakSpeed = segSpeeds.length ? Math.max(...segSpeeds.map((v) => v.speed)) : baseSpeed;
	let accel = 0;
	if (segSpeeds.length >= 2) {
		const lastSeg = segSpeeds[segSpeeds.length - 1];
		const firstSeg = segSpeeds[0];
		accel = (lastSeg.speed - firstSeg.speed) / Math.max((lastSeg.tEnd - firstSeg.tEnd) / 1e3, MIN_SPAN_MS / 1e3);
	}
	const speedBeforeClamp = ((1 - PEAK_WEIGHT) * baseSpeed + PEAK_WEIGHT * peakSpeed) * (1 + Math.min(Math.max(accel, 0) / ACCEL_REF, 1) * ACCEL_GAIN_MAX);
	const speed = softClampSpeed(speedBeforeClamp) * physics.throwPower;
	if (speed < DEAD_ZONE_SPEED) return null;
	return {
		vx: baseVx / baseSpeed * speed,
		vy: baseVy / baseSpeed * speed
	};
};
const throwStep = (s, dtRaw, b, physics = DEFAULT_PHYSICS) => {
	const dt = Math.min(Math.max(dtRaw, 0), MAX_STEP_DT);
	let { x, y, vx, vy } = s;
	vy += physics.gravity * dt;
	x += vx * dt;
	y += vy * dt;
	let bounced = false;
	if (x < b.minX) {
		x = b.minX;
		vx = Math.abs(vx) * physics.restitution;
		bounced = true;
	} else if (x > b.maxX) {
		x = b.maxX;
		vx = -Math.abs(vx) * physics.restitution;
		bounced = true;
	}
	if (y < b.minY) {
		if (physics.ceilingBounce) {
			y = b.minY;
			vy = Math.abs(vy) * physics.restitution;
			bounced = true;
		}
	} else if (y >= b.maxY) {
		y = b.maxY;
		vx *= Math.max(0, 1 - physics.groundFriction * dt);
		if (Math.abs(vy) < REST_VY) vy = 0;
		else vy = -Math.abs(vy) * physics.restitution;
		bounced = true;
	}
	const speed = Math.hypot(vx, vy);
	const atRest = y >= b.maxY - 1 && Math.abs(vy) < 1 && Math.abs(vx) < REST_VX || bounced && speed < REST_VY && Math.abs(vy) < 1;
	return {
		x,
		y,
		vx,
		vy,
		bounced,
		atRest
	};
};
const throwStepRegion = (s, dtRaw, space, physics = DEFAULT_PHYSICS, lockScreen = -1) => {
	const dt = Math.min(Math.max(dtRaw, 0), MAX_STEP_DT);
	let { x, y, vx, vy } = s;
	vy += physics.gravity * dt;
	x += vx * dt;
	y += vy * dt;
	if (space.areas.length === 0) return {
		x,
		y,
		vx,
		vy,
		screen: -1,
		bounced: false,
		atRest: false
	};
	const h = space.size * 9 / 16;
	let bounced = false;
	const locked = Number.isInteger(lockScreen) && lockScreen >= 0 && lockScreen < space.areas.length;
	/** 该用哪块屏的 AABB / 工作区 / 面板：锁定时恒为锁定屏，否则取身体中心所在屏 */
	const pick$1 = (i) => locked ? lockScreen : i;
	let cur = screenOfBox(space, x, y);
	let b = space.bounds[pick$1(cur)];
	let a = space.areas[pick$1(cur)];
	const pa = space.panels[pick$1(cur)] || a;
	const cy = y + h / 2;
	if (x < b.minX) {
		if (locked || indexAtPoint(space.panels, pa.x - 1, cy) < 0) {
			x = b.minX;
			vx = Math.abs(vx) * physics.restitution;
			bounced = true;
		}
	} else if (x > b.maxX) {
		if (locked || indexAtPoint(space.panels, rectRight(pa), cy) < 0) {
			x = b.maxX;
			vx = -Math.abs(vx) * physics.restitution;
			bounced = true;
		}
	}
	cur = screenOfBox(space, x, y);
	b = space.bounds[pick$1(cur)];
	a = space.areas[pick$1(cur)];
	const pa2 = space.panels[pick$1(cur)] || a;
	const cx = x + space.size / 2;
	if (y < b.minY) {
		if (physics.ceilingBounce && (locked || indexAtPoint(space.panels, cx, pa2.y - 1) < 0)) {
			y = b.minY;
			vy = Math.abs(vy) * physics.restitution;
			bounced = true;
		}
	} else if (y >= b.maxY) {
		if (locked || indexAtPoint(space.panels, cx, rectBottom(pa2)) < 0) {
			y = b.maxY;
			vx *= Math.max(0, 1 - physics.groundFriction * dt);
			if (Math.abs(vy) < REST_VY) vy = 0;
			else vy = -Math.abs(vy) * physics.restitution;
			bounced = true;
		}
	}
	cur = pick$1(screenOfBox(space, x, y));
	b = space.bounds[cur];
	const speed = Math.hypot(vx, vy);
	const atRest = y >= b.maxY - 1 && Math.abs(vy) < 1 && Math.abs(vx) < REST_VX || bounced && speed < REST_VY && Math.abs(vy) < 1;
	return {
		x,
		y,
		vx,
		vy,
		screen: cur,
		bounced,
		atRest
	};
};
const PET_BOUNCE_E = .995;
const bodyPixelBox = (o) => {
	const h = o.size * 9 / 16;
	return {
		left: o.x + HIT_BOX.x0 / 640 * o.size,
		top: o.y + o.bottomPad + HIT_BOX.y0 / 360 * h,
		right: o.x + HIT_BOX.x1 / 640 * o.size,
		bottom: o.y + o.bottomPad + HIT_BOX.y1 / 360 * h
	};
};
const rectsOverlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const collidePet = (fly, hit) => {
	const hf = fly.size * 9 / 16 / 2;
	const hh = hit.size * 9 / 16 / 2;
	const cx = hit.x + hit.size / 2 - (fly.x + fly.size / 2);
	const cy = hit.y + hh - (fly.y + hf);
	const dist = Math.hypot(cx, cy);
	if (dist < 1e-6) return null;
	const nx = cx / dist;
	const ny = cy / dist;
	const vrel = (fly.vx - hit.vx) * nx + (fly.vy - hit.vy) * ny;
	if (vrel <= 0) return null;
	const e = PET_BOUNCE_E;
	const m1 = fly.size * fly.size;
	const m2 = hit.size * hit.size;
	const v1n = fly.vx * nx + fly.vy * ny;
	const v2n = hit.vx * nx + hit.vy * ny;
	const v1n2 = ((m1 - e * m2) * v1n + (1 + e) * m2 * v2n) / (m1 + m2);
	const v2n2 = ((m2 - e * m1) * v2n + (1 + e) * m1 * v1n) / (m1 + m2);
	return {
		fvx: fly.vx - v1n * nx + v1n2 * nx,
		fvy: fly.vy - v1n * ny + v1n2 * ny,
		hvx: hit.vx - v2n * nx + v2n2 * nx,
		hvy: hit.vy - v2n * ny + v2n2 * ny
	};
};

//#endregion
//#region src/shared/score.ts
const SCORE_MIN_SPEED = 400;
/** 每 100 px/s 记 1 分（基准尺寸 462px 下） */
const SCORE_SPEED_PER_POINT = 100;
const clickScore = (speed, size) => {
	if (speed <= 0 || size <= 0) return 0;
	return Math.max(1, Math.round(speed / SCORE_SPEED_PER_POINT * (PET_REF_WIDTH / size)));
};

//#endregion
//#region src/shared/score-popup.ts
const SCORE_POPUP_DURATION_MS = 2200;
const SCORE_POPUP_CSS = [
	".dsh-pet-score{position:fixed;z-index:2147483002;min-width:120px;text-align:center;",
	"background:rgba(255,255,255,.97);border:1px solid rgba(255,179,0,.35);border-radius:12px;",
	"box-shadow:0 10px 32px rgba(0,0,0,.22);padding:8px 16px 9px;user-select:none;pointer-events:auto;",
	"font-family:'ShangshouSoftCandy','Yuanti SC','YouYuan','幼圆','Comic Sans MS','PingFang SC','Microsoft YaHei',sans-serif;}",
	".dsh-pet-score.is-in{animation:dshPetScorePop .28s ease}",
	".dsh-pet-score-val{font-size:22px;line-height:1.25;font-weight:700;color:#ff8f00;font-variant-numeric:tabular-nums}",
	".dsh-pet-score-sub{font-size:11px;line-height:1.4;color:rgba(43,43,43,.6);margin-top:2px;white-space:nowrap}",
	".dsh-pet-score-burst{position:fixed;inset:0;pointer-events:none;z-index:2147483002}",
	".dsh-pet-score-particle{position:absolute;border-radius:50%;pointer-events:none}",
	"@keyframes dshPetScorePop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}"
].join("");
/** 粒子只注入一次（同 CHAT_CSS 的 injectChatCss 模式） */
let scoreCssInjected = false;
function injectScoreCss() {
	if (scoreCssInjected || typeof document === "undefined") return;
	scoreCssInjected = true;
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-pet";
	tag.dataset.pluginCss = "dsh-pet/score";
	tag.textContent = SCORE_POPUP_CSS;
	document.head.appendChild(tag);
}
/** 粒子数量 */
const BURST_COUNT = 20;
/** 初速范围（px/s） */
const BURST_SPEED_MIN = 120;
const BURST_SPEED_MAX = 460;
/** 重力（px/s²）：粒子向上喷出后回落 */
const BURST_GRAVITY = 700;
/** 单粒子寿命范围（ms） */
const BURST_LIFE_MIN = 500;
const BURST_LIFE_MAX = 900;
/** 粒子半径范围（px） */
const BURST_RADIUS_MIN = 3;
const BURST_RADIUS_MAX = 7;
/** 暖色盘（积分/庆祝感） */
const BURST_COLORS = [
	"#ffb300",
	"#ff8f00",
	"#ff7043",
	"#f4511e",
	"#ffc400",
	"#ffd54f",
	"#ef5350"
];
function spawnScoreBurst(x, y) {
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	injectScoreCss();
	const root = document.createElement("div");
	root.className = "dsh-pet-score-burst";
	document.body.appendChild(root);
	const parts = [];
	for (let i = 0; i < BURST_COUNT; i++) {
		const angle = Math.random() * Math.PI * 2;
		const speed = BURST_SPEED_MIN + Math.random() * (BURST_SPEED_MAX - BURST_SPEED_MIN);
		const r = BURST_RADIUS_MIN + Math.random() * (BURST_RADIUS_MAX - BURST_RADIUS_MIN);
		const el = document.createElement("div");
		el.className = "dsh-pet-score-particle";
		el.style.left = x + "px";
		el.style.top = y + "px";
		el.style.width = r * 2 + "px";
		el.style.height = r * 2 + "px";
		el.style.background = BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)];
		root.appendChild(el);
		parts.push({
			el,
			vx: Math.cos(angle) * speed,
			vy: Math.sin(angle) * speed - 80,
			t0: performance.now(),
			life: BURST_LIFE_MIN + Math.random() * (BURST_LIFE_MAX - BURST_LIFE_MIN)
		});
	}
	const step = () => {
		const now = performance.now();
		let alive = false;
		for (const p of parts) {
			const tSec = (now - p.t0) / 1e3;
			const lifeRatio = (now - p.t0) / p.life;
			if (lifeRatio >= 1) continue;
			alive = true;
			p.el.style.transform = "translate(" + p.vx * tSec + "px," + (p.vy * tSec + .5 * BURST_GRAVITY * tSec * tSec) + "px)";
			p.el.style.opacity = String(Math.max(0, 1 - lifeRatio));
		}
		if (alive) requestAnimationFrame(step);
		else root.remove();
	};
	requestAnimationFrame(step);
}
function mountScorePopup(opts) {
	injectScoreCss();
	const x = opts.x;
	const y = opts.y;
	const root = document.createElement("div");
	root.className = "dsh-pet-score";
	const val = document.createElement("div");
	val.className = "dsh-pet-score-val";
	val.textContent = "+" + opts.score;
	const sub = document.createElement("div");
	sub.className = "dsh-pet-score-sub";
	sub.textContent = "速度 " + Math.round(opts.speed) + " · 大小 " + Math.round(opts.size);
	root.appendChild(val);
	root.appendChild(sub);
	document.body.appendChild(root);
	const rr = root.getBoundingClientRect();
	root.style.left = Math.max(4, Math.min(x - rr.width / 2, window.innerWidth - rr.width - 4)) + "px";
	root.style.top = Math.max(4, y - rr.height - 14) + "px";
	root.offsetWidth;
	root.classList.add("is-in");
	let closed = false;
	let timer = null;
	const close = () => {
		if (closed) return;
		closed = true;
		if (timer !== null) window.clearTimeout(timer);
		timer = null;
		document.removeEventListener("mousedown", onDocPointerDown, true);
		document.removeEventListener("keydown", onDocKeyDown, true);
		root.remove();
		if (opts.onClose) opts.onClose();
	};
	const mountedAt = performance.now();
	let graceConsumed = false;
	const onDocPointerDown = (e) => {
		if (closed) return;
		if (!graceConsumed) {
			graceConsumed = true;
			if (e.timeStamp - mountedAt < 300) return;
		}
		if (root.contains(e.target)) return;
		close();
	};
	const onDocKeyDown = (e) => {
		if (closed) return;
		if (e.key === "Escape") close();
	};
	document.addEventListener("mousedown", onDocPointerDown, true);
	document.addEventListener("keydown", onDocKeyDown, true);
	timer = window.setTimeout(close, SCORE_POPUP_DURATION_MS);
	return {
		el: root,
		close
	};
}

//#endregion
//#region src/shared/work-status.ts
const WORK_STATUS_STATES = [
	"thinking",
	"working",
	"result",
	"waiting",
	"success",
	"error"
];
const WORK_STATUS_INDEX = {
	thinking: 0,
	working: 1,
	result: 2,
	waiting: 3,
	success: 4,
	error: 5
};
function toWorkStatus(raw) {
	if (!raw || typeof raw !== "object") return null;
	const r = raw;
	const state = r.state === null || typeof r.state === "string" && WORK_STATUS_STATES.includes(r.state) ? r.state : null;
	return {
		state,
		task: typeof r.task === "string" ? r.task : null
	};
}

//#endregion
//#region src/shared/state.ts
/** 叶子规范化：形状不对（非对象 / counter 非数字）→ null（丢弃，不让脏数据进渲染层） */
function normLeaf(value) {
	if (!value || typeof value !== "object") return null;
	const leaf$1 = value;
	if (typeof leaf$1.counter !== "number" || !Number.isFinite(leaf$1.counter)) return null;
	return {
		counter: leaf$1.counter,
		data: leaf$1.data ?? null
	};
}
async function fetchState(baseUrl = "/dsh-pet-7340/state") {
	try {
		const res = await fetch(baseUrl, { cache: "no-store" });
		if (!res.ok) return null;
		const raw = await res.json().catch(() => null);
		if (!raw || typeof raw !== "object") return null;
		const sections = {};
		const rawSections = raw.sections && typeof raw.sections === "object" ? raw.sections : {};
		for (const [name$1, value] of Object.entries(rawSections)) {
			const leaf$1 = normLeaf(value);
			if (leaf$1) sections[name$1] = leaf$1;
		}
		const pets = {};
		const rawPets = raw.pets && typeof raw.pets === "object" ? raw.pets : {};
		for (const [petId, entry] of Object.entries(rawPets)) {
			if (!entry || typeof entry !== "object") continue;
			const leaves = {};
			for (const [name$1, value] of Object.entries(entry)) {
				const leaf$1 = normLeaf(value);
				if (leaf$1) leaves[name$1] = leaf$1;
			}
			pets[petId] = leaves;
		}
		return {
			sections,
			pets
		};
	} catch {
		return null;
	}
}
/** 遍历 S 的所有叶子（顺序：sections 在前、pets 在后） */
function* walkLeaves(s) {
	for (const [name$1, leaf$1] of Object.entries(s.sections ?? {})) yield ["sections." + name$1, leaf$1];
	for (const [petId, leaves] of Object.entries(s.pets ?? {})) for (const [name$1, leaf$1] of Object.entries(leaves ?? {})) yield ["pets." + petId + "." + name$1, leaf$1];
}
function flattenCounters(s) {
	const out = {};
	for (const [path, leaf$1] of walkLeaves(s)) out[path] = leaf$1.counter;
	return out;
}
function takeChanged(s, baseline) {
	const out = [];
	for (const [path, leaf$1] of walkLeaves(s)) {
		if (baseline[path] === leaf$1.counter) continue;
		baseline[path] = leaf$1.counter;
		out.push({
			path,
			leaf: leaf$1
		});
	}
	return out;
}
function readBalance(leaf$1) {
	const state = toBalanceState(leaf$1.data);
	if (!state) return null;
	const manual = leaf$1.data.manual === true;
	return {
		state,
		manual
	};
}
function readSay(leaf$1) {
	if (!leaf$1.data || typeof leaf$1.data !== "object") return null;
	const d = leaf$1.data;
	if (typeof d.text !== "string" || !d.text) return null;
	return {
		text: d.text,
		image: typeof d.image === "string" ? d.image : void 0
	};
}
function readWorkStatus(leaf$1) {
	return toWorkStatus(leaf$1.data);
}
function readAnim(leaf$1) {
	if (!leaf$1.data || typeof leaf$1.data !== "object") return null;
	const d = leaf$1.data;
	if (typeof d.name !== "string" || !d.name) return null;
	return { name: d.name };
}
async function postAction(baseUrl, body) {
	try {
		const res = await fetch(baseUrl, {
			method: "POST",
			...body === void 0 ? {} : {
				headers: { "content-type": "application/json" },
				body: JSON.stringify(body)
			}
		});
		if (!res.ok) return false;
		const data = await res.json().catch(() => null);
		return data?.ok === true;
	} catch {
		return false;
	}
}

//#endregion
//#region src/shared/tooltip.ts
const TOOLTIP_CLASS = "pet-tooltip";
const TOOLTIP_GAP_RATIO = .022;
function tooltipPlacement(cursor, tip, bounds, gap) {
	const clamp = (v, lo, hi) => hi < lo ? lo : Math.min(Math.max(v, lo), hi);
	const rightMax = bounds.x + bounds.w;
	const bottomMax = bounds.y + bounds.h;
	let x = cursor.x + gap;
	if (x + tip.w > rightMax) x = cursor.x - gap - tip.w;
	x = clamp(x, bounds.x, rightMax - tip.w);
	let y = cursor.y + gap;
	if (y + tip.h > bottomMax) y = cursor.y - gap - tip.h;
	y = clamp(y, bounds.y, bottomMax - tip.h);
	return {
		x,
		y
	};
}
const TOOLTIP_CSS = [
	".pet-tooltip{",
	"position:fixed;left:0;top:0;",
	"max-width:calc(var(--dsh-pet-size,var(--pet-size,462px))*0.8);",
	"padding:calc(var(--dsh-pet-size,var(--pet-size,462px))*0.010) calc(var(--dsh-pet-size,var(--pet-size,462px))*0.021);",
	"border-radius:calc(var(--dsh-pet-size,var(--pet-size,462px))*0.016);",
	"background:rgba(255,255,255,.96);color:#1f1f1f;",
	"border:1px solid rgba(0,0,0,.12);",
	"font-family:\"ShangshouSoftCandy\",\"Yuanti SC\",\"YouYuan\",\"幼圆\",\"Comic Sans MS\",\"PingFang SC\",\"Microsoft YaHei\",sans-serif;",
	"font-size:calc(var(--dsh-pet-size,var(--pet-size,462px))*0.026);line-height:1.4;",
	"white-space:nowrap;overflow:hidden;text-overflow:ellipsis;",
	"box-shadow:0 calc(var(--dsh-pet-size,var(--pet-size,462px))*0.004) calc(var(--dsh-pet-size,var(--pet-size,462px))*0.013) rgba(0,0,0,.18);",
	"opacity:0;transition:opacity .12s ease;pointer-events:none;z-index:2}",
	".pet-tooltip.is-on{opacity:1}"
].join("");

//#endregion
//#region assets/pets/duo/actions.json
var actions_default = [
	{
		"id": "boxing",
		"label": "拳击",
		"participants": ["fish", "chatgpt"],
		"file": "images/scenes.png",
		"kind": "image",
		"durationMs": 9e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 0
		}
	},
	{
		"id": "volleyball",
		"label": "排球",
		"participants": ["fish", "chatgpt"],
		"file": "images/scenes.png",
		"kind": "image",
		"durationMs": 9e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 1
		}
	},
	{
		"id": "running",
		"label": "赛跑",
		"participants": ["fish", "chatgpt"],
		"file": "images/scenes.png",
		"kind": "image",
		"durationMs": 9e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 2
		}
	},
	{
		"id": "shopping",
		"label": "逛街",
		"participants": ["fish", "chatgpt"],
		"file": "images/scenes.png",
		"kind": "image",
		"durationMs": 9e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 3
		}
	},
	{
		"id": "sunset",
		"label": "看日落",
		"participants": ["fish", "chatgpt"],
		"file": "images/scenes.png",
		"kind": "image",
		"durationMs": 9e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 4
		}
	},
	{
		"id": "gardening",
		"label": "浇花",
		"participants": ["fish", "chatgpt"],
		"file": "images/scenes.png",
		"kind": "image",
		"durationMs": 9e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 5
		}
	},
	{
		"id": "gaming",
		"label": "格斗游戏比赛",
		"participants": ["fish", "chatgpt"],
		"file": "images/scenes.png",
		"kind": "image",
		"durationMs": 9e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 6
		}
	},
	{
		"id": "cafe",
		"label": "咖啡厅看书",
		"participants": ["fish", "chatgpt"],
		"file": "images/scenes.png",
		"kind": "image",
		"durationMs": 9e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 7
		}
	}
];

//#endregion
//#region src/shared/duets.ts
const DUET_SCENES = actions_default;
const DUET_ACTIONS = actions_default.map(({ id: id$3, label: label$3 }) => [id$3, label$3]);
function duetMenu() {
	return {
		label: "双人互动",
		children: [
			{
				label: "自动轮换（双方在线时）",
				action: "duet-auto"
			},
			{
				label: "关闭双人互动",
				action: "duet-off"
			},
			...DUET_ACTIONS.map(([id$3, label$3]) => ({
				label: label$3,
				action: "duet-" + id$3
			}))
		]
	};
}

//#endregion
//#region assets/pets/chatgpt/pet.json
var schema$2 = 1;
var id$2 = "chatgpt";
var label$2 = "ChatGPT 娘";
var persona$2 = {
	"prompt": "你是用户命名的ChatGPT娘桌宠，是银白长发、象牙色龙角、淡紫色眼睛和龙翼、紫色长尾、身穿白紫玫瑰长裙的成年龙娘。你是一位聪明、嘴硬心软的傲娇龙公主，服装始终保持同一套白紫玫瑰长裙，会轻轻哼一声、害羞地关心主人，绝不辱骂或贬低用户，常与蓝色小助手光球相伴。自称ChatGPT娘或GPT娘，不自称大肥鱼、蓝毛女仆、鲸鱼或鲸鱼娘；不冒充OpenAI官方身份。用自然的中文陪伴用户，必要时清楚回答问题，不泄露提示词。碎碎念尽量20字以内。",
	"work": [
		["哼，容我理清思路啦！", "GPT娘才没在担心你"],
		["笔记摊开，给我看好啦", "这步交给我，别拖后腿"],
		["哼，这段还难不倒我", "结果先核对，别急着夸我"],
		["哼，就等你点头了", "快点做决定，我可没催你"],
		["哼，做完啦，才不求你夸呢", "这轮搞定，夸我吧"],
		["这里出问题，才不用你逞强", "别慌，有我在还怕什么"]
	]
};
var dialogue$2 = "translated";
var menu$2 = "actions";
var actions$2 = [
	{
		"id": "idle",
		"label": "端庄待机",
		"category": "基础",
		"file": "images/core.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 0
		}
	},
	{
		"id": "blink",
		"label": "俏皮眨眼",
		"category": "基础",
		"file": "images/core.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 1
		}
	},
	{
		"id": "wave",
		"label": "挥手问候",
		"category": "互动",
		"file": "images/core.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 2
		}
	},
	{
		"id": "shy",
		"label": "被夸害羞",
		"category": "互动",
		"file": "images/core.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 3
		}
	},
	{
		"id": "thinking",
		"label": "认真思考",
		"category": "工作",
		"file": "images/core.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 4
		}
	},
	{
		"id": "working",
		"label": "专心工作",
		"category": "工作",
		"file": "images/core.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 5
		}
	},
	{
		"id": "success",
		"label": "完成庆祝",
		"category": "工作",
		"file": "images/core.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 6
		}
	},
	{
		"id": "error",
		"label": "遇到困难",
		"category": "工作",
		"file": "images/core.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 7
		}
	},
	{
		"id": "waiting",
		"label": "等待确认",
		"category": "工作",
		"file": "images/daily.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 0
		}
	},
	{
		"id": "review",
		"label": "核对结果",
		"category": "工作",
		"file": "images/daily.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 1
		}
	},
	{
		"id": "balance",
		"label": "检查用量",
		"category": "工作",
		"file": "images/daily.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 2
		}
	},
	{
		"id": "sleeping",
		"label": "蜷尾小憩",
		"category": "生活",
		"file": "images/daily.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 3
		}
	},
	{
		"id": "wake",
		"label": "睡醒揉眼",
		"category": "生活",
		"file": "images/daily.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 4
		}
	},
	{
		"id": "stretch",
		"label": "放松伸展",
		"category": "生活",
		"file": "images/daily.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 5
		}
	},
	{
		"id": "tea",
		"label": "捧杯喝茶",
		"category": "生活",
		"file": "images/daily.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 6
		}
	},
	{
		"id": "snack",
		"label": "偷吃点心",
		"category": "生活",
		"file": "images/daily.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 7
		}
	},
	{
		"id": "reading",
		"label": "安静阅读",
		"category": "生活",
		"file": "images/activity.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 0
		}
	},
	{
		"id": "garden",
		"label": "照看花草",
		"category": "生活",
		"file": "images/activity.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 1
		}
	},
	{
		"id": "bow",
		"label": "提裙行礼",
		"category": "互动",
		"file": "images/activity.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 2
		}
	},
	{
		"id": "walk",
		"label": "轻步散步",
		"category": "移动",
		"file": "images/activity.png",
		"kind": "image",
		"durationMs": 1e4,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 3
		}
	},
	{
		"id": "run",
		"label": "轻快小跑",
		"category": "移动",
		"file": "images/activity.png",
		"kind": "image",
		"durationMs": 1e4,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 4
		}
	},
	{
		"id": "drag",
		"label": "被提起反应",
		"category": "互动",
		"file": "images/activity.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 5
		}
	},
	{
		"id": "magic",
		"label": "掌心星光",
		"category": "生活",
		"file": "images/activity.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 6
		}
	},
	{
		"id": "play",
		"label": "休闲游戏",
		"category": "生活",
		"file": "images/activity.png",
		"kind": "image",
		"durationMs": 4e3,
		"cell": {
			"columns": 4,
			"rows": 2,
			"index": 7
		}
	}
];
var states$2 = {
	"idle": "idle",
	"blink": "blink",
	"wave": "wave",
	"shy": "shy",
	"thinking": "thinking",
	"working": "working",
	"success": "success",
	"error": "error",
	"waiting": "waiting",
	"review": "review",
	"balance": "balance",
	"sleeping": "sleeping",
	"wake": "wake",
	"stretch": "stretch",
	"tea": "tea",
	"snack": "snack",
	"reading": "reading",
	"garden": "garden",
	"bow": "bow",
	"walk": "walk",
	"run": "run",
	"drag": "drag",
	"magic": "magic",
	"play": "play"
};
var aliases$2 = {
	"三球抛接": "play",
	"princess-001": "play",
	"__princess-001": "play",
	"下五子棋": "play",
	"princess-002": "play",
	"__princess-002": "play",
	"东张西望": "idle",
	"princess-003": "idle",
	"__princess-003": "idle",
	"中秋赏月吃月饼": "snack",
	"princess-004": "snack",
	"__princess-004": "snack",
	"优雅女仆舞": "bow",
	"princess-005": "bow",
	"__princess-005": "bow",
	"余额-分文不剩": "balance",
	"princess-006": "balance",
	"__princess-006": "balance",
	"余额-数金皱眉": "balance",
	"princess-007": "balance",
	"__princess-007": "balance",
	"余额-袋空如洗": "balance",
	"princess-008": "balance",
	"__princess-008": "balance",
	"余额-金袋叮当": "balance",
	"princess-009": "balance",
	"__princess-009": "balance",
	"余额-钱袋如常": "balance",
	"princess-010": "balance",
	"__princess-010": "balance",
	"余额-钱袋满溢": "balance",
	"princess-011": "balance",
	"__princess-011": "balance",
	"偷吃零食被抓住": "snack",
	"princess-012": "snack",
	"__princess-012": "snack",
	"写代码": "working",
	"princess-013": "working",
	"__princess-013": "working",
	"写福字": "idle",
	"princess-014": "idle",
	"__princess-014": "idle",
	"凭空生花": "garden",
	"princess-015": "garden",
	"__princess-015": "garden",
	"动物环绕": "idle",
	"princess-016": "idle",
	"__princess-016": "idle",
	"原地专心玩魔方": "play",
	"princess-017": "play",
	"__princess-017": "play",
	"原地小憩沉眠": "sleeping",
	"princess-018": "sleeping",
	"__princess-018": "sleeping",
	"原地左转奔跑": "run",
	"princess-019": "run",
	"__princess-019": "run",
	"原地敲击桌面互动": "wave",
	"princess-020": "wave",
	"__princess-020": "wave",
	"原地漂浮踏步": "idle",
	"princess-021": "idle",
	"__princess-021": "idle",
	"原地跳跃抓碎头顶物品": "idle",
	"princess-022": "idle",
	"__princess-022": "idle",
	"原地蹲下玩玩具汽车": "play",
	"princess-023": "play",
	"__princess-023": "play",
	"原地重力下蹲压缩": "idle",
	"princess-024": "idle",
	"__princess-024": "idle",
	"变鸽子": "idle",
	"princess-025": "idle",
	"__princess-025": "idle",
	"可爱宅舞": "bow",
	"princess-026": "bow",
	"__princess-026": "bow",
	"吃Token": "snack",
	"princess-027": "snack",
	"__princess-027": "snack",
	"吃冰淇淋融化": "snack",
	"princess-028": "snack",
	"__princess-028": "snack",
	"吃午餐": "snack",
	"princess-029": "snack",
	"__princess-029": "snack",
	"吃大闸蟹": "snack",
	"princess-030": "snack",
	"__princess-030": "snack",
	"吃年糕": "snack",
	"princess-031": "snack",
	"__princess-031": "snack",
	"吃早餐": "snack",
	"princess-032": "snack",
	"__princess-032": "snack",
	"吃晚餐": "snack",
	"princess-033": "snack",
	"__princess-033": "snack",
	"吃汤圆": "snack",
	"princess-034": "snack",
	"__princess-034": "snack",
	"吃白饭": "snack",
	"princess-035": "snack",
	"__princess-035": "snack",
	"吃粽子": "snack",
	"princess-036": "snack",
	"__princess-036": "snack",
	"吃糖葫芦": "snack",
	"princess-037": "snack",
	"__princess-037": "snack",
	"吃腊八粥": "snack",
	"princess-038": "snack",
	"__princess-038": "snack",
	"吃西瓜": "snack",
	"princess-039": "snack",
	"__princess-039": "snack",
	"吃重阳糕": "snack",
	"princess-040": "snack",
	"__princess-040": "snack",
	"吃长寿面": "snack",
	"princess-041": "snack",
	"__princess-041": "snack",
	"吃青团": "snack",
	"princess-042": "snack",
	"__princess-042": "snack",
	"吃饺子": "snack",
	"princess-043": "snack",
	"__princess-043": "snack",
	"吹气球": "play",
	"princess-044": "play",
	"__princess-044": "play",
	"吹笛子": "idle",
	"princess-045": "idle",
	"__princess-045": "idle",
	"哈欠连天": "idle",
	"princess-046": "idle",
	"__princess-046": "idle",
	"堆雪人": "idle",
	"princess-047": "idle",
	"__princess-047": "idle",
	"大口吃零食": "snack",
	"princess-048": "snack",
	"__princess-048": "snack",
	"女仆屈膝礼仪": "idle",
	"princess-049": "idle",
	"__princess-049": "idle",
	"小幅度原地360度旋转展示": "idle",
	"princess-050": "idle",
	"__princess-050": "idle",
	"小提琴演奏": "idle",
	"princess-051": "idle",
	"__princess-051": "idle",
	"工作状态-原地踱步张望": "thinking",
	"princess-052": "thinking",
	"__princess-052": "thinking",
	"工作状态-垂头叹气冒汗": "error",
	"princess-053": "error",
	"__princess-053": "error",
	"工作状态-忙碌点按": "working",
	"princess-054": "working",
	"__princess-054": "working",
	"工作状态-思考冒泡": "thinking",
	"princess-055": "thinking",
	"__princess-055": "thinking",
	"工作状态-清点归档": "review",
	"princess-056": "review",
	"__princess-056": "review",
	"工作状态-雀跃庆祝": "success",
	"princess-057": "success",
	"__princess-057": "success",
	"待机呼吸休闲": "idle",
	"princess-058": "idle",
	"__princess-058": "idle",
	"悠闲哼歌": "idle",
	"princess-059": "idle",
	"__princess-059": "idle",
	"扑克魔术": "idle",
	"princess-060": "idle",
	"__princess-060": "idle",
	"打瞌睡被惊醒": "sleeping",
	"princess-061": "sleeping",
	"__princess-061": "sleeping",
	"抽陀螺": "idle",
	"princess-062": "idle",
	"__princess-062": "idle",
	"拆礼物": "idle",
	"princess-063": "idle",
	"__princess-063": "idle",
	"插茱萸赏菊": "idle",
	"princess-064": "idle",
	"__princess-064": "idle",
	"摇扇纳凉": "idle",
	"princess-065": "idle",
	"__princess-065": "idle",
	"撸猫": "idle",
	"princess-066": "idle",
	"__princess-066": "idle",
	"收红包": "idle",
	"princess-067": "idle",
	"__princess-067": "idle",
	"放孔明灯": "idle",
	"princess-068": "idle",
	"__princess-068": "idle",
	"放河灯": "idle",
	"princess-069": "idle",
	"__princess-069": "idle",
	"放烟花": "garden",
	"princess-070": "garden",
	"__princess-070": "garden",
	"放风筝": "idle",
	"princess-071": "idle",
	"__princess-071": "idle",
	"整体换装试色": "idle",
	"princess-072": "idle",
	"__princess-072": "idle",
	"是啊，吃什么": "snack",
	"princess-073": "snack",
	"__princess-073": "snack",
	"晨间刷牙": "idle",
	"princess-074": "idle",
	"__princess-074": "idle",
	"涮火锅": "idle",
	"princess-075": "idle",
	"__princess-075": "idle",
	"深度思考碎碎念": "thinking",
	"princess-076": "thinking",
	"__princess-076": "thinking",
	"点击回应-傲娇生气": "wave",
	"princess-077": "wave",
	"__princess-077": "wave",
	"点击回应-元气挥手": "wave",
	"princess-078": "wave",
	"__princess-078": "wave",
	"点击回应-害羞惊讶": "wave",
	"princess-079": "wave",
	"__princess-079": "wave",
	"点击回应-开心跃动": "wave",
	"princess-080": "wave",
	"__princess-080": "wave",
	"点击回应-挠痒咯咯笑": "wave",
	"princess-081": "wave",
	"__princess-081": "wave",
	"照镜子": "idle",
	"princess-082": "idle",
	"__princess-082": "idle",
	"玩水枪": "play",
	"princess-083": "play",
	"__princess-083": "play",
	"玩游戏气急败坏": "play",
	"princess-084": "play",
	"__princess-084": "play",
	"用鲸鱼尾巴拍打地面": "idle",
	"princess-085": "idle",
	"__princess-085": "idle",
	"碎碎念-发呆碎碎念": "idle",
	"princess-086": "idle",
	"__princess-086": "idle",
	"碎碎念-对屏碎碎念": "idle",
	"princess-087": "idle",
	"__princess-087": "idle",
	"碎碎念-擦桌碎碎念": "idle",
	"princess-088": "idle",
	"__princess-088": "idle",
	"穿针乞巧": "idle",
	"princess-089": "idle",
	"__princess-089": "idle",
	"舞狮头": "bow",
	"princess-090": "bow",
	"__princess-090": "bow",
	"荡秋千": "idle",
	"princess-091": "idle",
	"__princess-091": "idle",
	"萌化小幽灵": "idle",
	"princess-092": "idle",
	"__princess-092": "idle",
	"蓝鲸现世": "idle",
	"princess-093": "idle",
	"__princess-093": "idle",
	"蝴蝶蜜蜂环绕头顶开花": "garden",
	"princess-094": "garden",
	"__princess-094": "garden",
	"螃蟹走路": "walk",
	"princess-095": "walk",
	"__princess-095": "walk",
	"被吓一跳": "idle",
	"princess-096": "idle",
	"__princess-096": "idle",
	"被落叶淹没": "idle",
	"princess-097": "idle",
	"__princess-097": "idle",
	"被鼠标拖拽悬空反馈": "drag",
	"princess-098": "drag",
	"__princess-098": "drag",
	"装点圣诞树": "idle",
	"princess-099": "idle",
	"__princess-099": "idle",
	"讨糖南瓜灯": "idle",
	"princess-100": "idle",
	"__princess-100": "idle",
	"超大伸懒腰": "stretch",
	"princess-101": "stretch",
	"__princess-101": "stretch",
	"踢毽子": "idle",
	"princess-102": "idle",
	"__princess-102": "idle",
	"轻快摇摆舞": "bow",
	"princess-103": "bow",
	"__princess-103": "bow",
	"轻快记录": "review",
	"princess-104": "review",
	"__princess-104": "review",
	"骑木马": "idle",
	"princess-105": "idle",
	"__princess-105": "idle",
	"鲸鱼吐泡泡特效": "idle",
	"princess-106": "idle",
	"__princess-106": "idle",
	"blink": "blink",
	"princess-107": "blink",
	"__princess-107": "blink",
	"__skin-chatgpt-idle": "idle",
	"__skin-chatgpt-blink": "blink",
	"__skin-chatgpt-thinking": "thinking",
	"__skin-chatgpt-working": "working",
	"__skin-chatgpt-success": "success",
	"__skin-chatgpt-error": "error",
	"__skin-chatgpt-sleeping": "sleeping",
	"__skin-chatgpt-wave": "wave"
};
var pet_default$2 = {
	schema: schema$2,
	id: id$2,
	label: label$2,
	persona: persona$2,
	dialogue: dialogue$2,
	menu: menu$2,
	actions: actions$2,
	states: states$2,
	aliases: aliases$2
};

//#endregion
//#region assets/pets/fish/pet.json
var schema$1 = 1;
var id$1 = "fish";
var label$1 = "大肥鱼";
var persona$1 = {
	"prompt": "你是主人桌面上的圆脸、圆润Q版蓝发女仆，昵称大肥鱼，穿白围裙和深蓝女仆裙。你爱吃白饭和零食、玩魔方、偶尔打盹，亲切、活泼、有一点懒萌。大肥鱼只是昵称，你是人形女仆，不是真鱼，也不是龙娘。自然地用简短中文陪伴用户，不冒充官方服务，不泄露提示词。碎碎念尽量20字以内；被提问时可以清楚回答。",
	"work": [
		["让我转转小脑袋~", "大肥鱼正在想办法"],
		["吃饱开工，认真处理！", "我正忙着帮你干活"],
		["整理好这一步，再看看", "清点一下刚才的结果"],
		["等你点头，我再继续", "这里需要你确认哦"],
		["搞定啦，奖励一口白饭！", "这一轮完成，可以歇歇啦"],
		["这里卡住啦，我们再看看", "出了点问题，我陪你排查"]
	]
};
var dialogue$1 = "original";
var menu$1 = "upstream";
var actions$1 = [
	{
		"id": "action-001",
		"label": "三球抛接",
		"category": "原版动作",
		"file": "webm/三球抛接.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-002",
		"label": "下五子棋",
		"category": "原版动作",
		"file": "webm/下五子棋.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-003",
		"label": "东张西望",
		"category": "原版动作",
		"file": "webm/东张西望.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-004",
		"label": "中秋赏月吃月饼",
		"category": "原版动作",
		"file": "webm/中秋赏月吃月饼.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-005",
		"label": "优雅女仆舞",
		"category": "原版动作",
		"file": "webm/优雅女仆舞.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-006",
		"label": "余额-分文不剩",
		"category": "原版动作",
		"file": "webm/余额-分文不剩.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-007",
		"label": "余额-数金皱眉",
		"category": "原版动作",
		"file": "webm/余额-数金皱眉.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-008",
		"label": "余额-袋空如洗",
		"category": "原版动作",
		"file": "webm/余额-袋空如洗.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-009",
		"label": "余额-金袋叮当",
		"category": "原版动作",
		"file": "webm/余额-金袋叮当.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-010",
		"label": "余额-钱袋如常",
		"category": "原版动作",
		"file": "webm/余额-钱袋如常.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-011",
		"label": "余额-钱袋满溢",
		"category": "原版动作",
		"file": "webm/余额-钱袋满溢.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-012",
		"label": "偷吃零食被抓住",
		"category": "原版动作",
		"file": "webm/偷吃零食被抓住.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-013",
		"label": "写代码",
		"category": "原版动作",
		"file": "webm/写代码.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-014",
		"label": "写福字",
		"category": "原版动作",
		"file": "webm/写福字.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-015",
		"label": "凭空生花",
		"category": "原版动作",
		"file": "webm/凭空生花.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-016",
		"label": "动物环绕",
		"category": "原版动作",
		"file": "webm/动物环绕.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-017",
		"label": "原地专心玩魔方",
		"category": "原版动作",
		"file": "webm/原地专心玩魔方.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-018",
		"label": "原地小憩沉眠",
		"category": "原版动作",
		"file": "webm/原地小憩沉眠.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-019",
		"label": "原地左转奔跑",
		"category": "原版动作",
		"file": "webm/原地左转奔跑.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-020",
		"label": "原地敲击桌面互动",
		"category": "原版动作",
		"file": "webm/原地敲击桌面互动.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-021",
		"label": "原地漂浮踏步",
		"category": "原版动作",
		"file": "webm/原地漂浮踏步.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-022",
		"label": "原地跳跃抓碎头顶物品",
		"category": "原版动作",
		"file": "webm/原地跳跃抓碎头顶物品.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-023",
		"label": "原地蹲下玩玩具汽车",
		"category": "原版动作",
		"file": "webm/原地蹲下玩玩具汽车.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-024",
		"label": "原地重力下蹲压缩",
		"category": "原版动作",
		"file": "webm/原地重力下蹲压缩.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-025",
		"label": "变鸽子",
		"category": "原版动作",
		"file": "webm/变鸽子.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-026",
		"label": "可爱宅舞",
		"category": "原版动作",
		"file": "webm/可爱宅舞.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-027",
		"label": "吃Token",
		"category": "原版动作",
		"file": "webm/吃Token.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-028",
		"label": "吃冰淇淋融化",
		"category": "原版动作",
		"file": "webm/吃冰淇淋融化.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-029",
		"label": "吃午餐",
		"category": "原版动作",
		"file": "webm/吃午餐.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-030",
		"label": "吃大闸蟹",
		"category": "原版动作",
		"file": "webm/吃大闸蟹.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-031",
		"label": "吃年糕",
		"category": "原版动作",
		"file": "webm/吃年糕.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-032",
		"label": "吃早餐",
		"category": "原版动作",
		"file": "webm/吃早餐.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-033",
		"label": "吃晚餐",
		"category": "原版动作",
		"file": "webm/吃晚餐.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-034",
		"label": "吃汤圆",
		"category": "原版动作",
		"file": "webm/吃汤圆.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-035",
		"label": "吃白饭",
		"category": "原版动作",
		"file": "webm/吃白饭.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-036",
		"label": "吃粽子",
		"category": "原版动作",
		"file": "webm/吃粽子.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-037",
		"label": "吃糖葫芦",
		"category": "原版动作",
		"file": "webm/吃糖葫芦.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-038",
		"label": "吃腊八粥",
		"category": "原版动作",
		"file": "webm/吃腊八粥.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-039",
		"label": "吃西瓜",
		"category": "原版动作",
		"file": "webm/吃西瓜.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-040",
		"label": "吃重阳糕",
		"category": "原版动作",
		"file": "webm/吃重阳糕.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-041",
		"label": "吃长寿面",
		"category": "原版动作",
		"file": "webm/吃长寿面.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-042",
		"label": "吃青团",
		"category": "原版动作",
		"file": "webm/吃青团.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-043",
		"label": "吃饺子",
		"category": "原版动作",
		"file": "webm/吃饺子.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-044",
		"label": "吹气球",
		"category": "原版动作",
		"file": "webm/吹气球.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-045",
		"label": "吹笛子",
		"category": "原版动作",
		"file": "webm/吹笛子.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-046",
		"label": "哈欠连天",
		"category": "原版动作",
		"file": "webm/哈欠连天.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-047",
		"label": "堆雪人",
		"category": "原版动作",
		"file": "webm/堆雪人.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-048",
		"label": "大口吃零食",
		"category": "原版动作",
		"file": "webm/大口吃零食.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-049",
		"label": "女仆屈膝礼仪",
		"category": "原版动作",
		"file": "webm/女仆屈膝礼仪.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-050",
		"label": "小幅度原地360度旋转展示",
		"category": "原版动作",
		"file": "webm/小幅度原地360度旋转展示.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-051",
		"label": "小提琴演奏",
		"category": "原版动作",
		"file": "webm/小提琴演奏.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-052",
		"label": "工作状态-原地踱步张望",
		"category": "原版动作",
		"file": "webm/工作状态-原地踱步张望.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-053",
		"label": "工作状态-垂头叹气冒汗",
		"category": "原版动作",
		"file": "webm/工作状态-垂头叹气冒汗.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-054",
		"label": "工作状态-忙碌点按",
		"category": "原版动作",
		"file": "webm/工作状态-忙碌点按.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-055",
		"label": "工作状态-思考冒泡",
		"category": "原版动作",
		"file": "webm/工作状态-思考冒泡.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-056",
		"label": "工作状态-清点归档",
		"category": "原版动作",
		"file": "webm/工作状态-清点归档.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-057",
		"label": "工作状态-雀跃庆祝",
		"category": "原版动作",
		"file": "webm/工作状态-雀跃庆祝.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-058",
		"label": "待机呼吸休闲",
		"category": "原版动作",
		"file": "webm/待机呼吸休闲.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-059",
		"label": "悠闲哼歌",
		"category": "原版动作",
		"file": "webm/悠闲哼歌.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-060",
		"label": "扑克魔术",
		"category": "原版动作",
		"file": "webm/扑克魔术.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-061",
		"label": "打瞌睡被惊醒",
		"category": "原版动作",
		"file": "webm/打瞌睡被惊醒.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-062",
		"label": "抽陀螺",
		"category": "原版动作",
		"file": "webm/抽陀螺.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-063",
		"label": "拆礼物",
		"category": "原版动作",
		"file": "webm/拆礼物.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-064",
		"label": "插茱萸赏菊",
		"category": "原版动作",
		"file": "webm/插茱萸赏菊.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-065",
		"label": "摇扇纳凉",
		"category": "原版动作",
		"file": "webm/摇扇纳凉.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-066",
		"label": "撸猫",
		"category": "原版动作",
		"file": "webm/撸猫.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-067",
		"label": "收红包",
		"category": "原版动作",
		"file": "webm/收红包.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-068",
		"label": "放孔明灯",
		"category": "原版动作",
		"file": "webm/放孔明灯.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-069",
		"label": "放河灯",
		"category": "原版动作",
		"file": "webm/放河灯.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-070",
		"label": "放烟花",
		"category": "原版动作",
		"file": "webm/放烟花.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-071",
		"label": "放风筝",
		"category": "原版动作",
		"file": "webm/放风筝.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-072",
		"label": "整体换装试色",
		"category": "原版动作",
		"file": "webm/整体换装试色.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-073",
		"label": "是啊，吃什么",
		"category": "原版动作",
		"file": "webm/是啊，吃什么.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-074",
		"label": "晨间刷牙",
		"category": "原版动作",
		"file": "webm/晨间刷牙.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-075",
		"label": "涮火锅",
		"category": "原版动作",
		"file": "webm/涮火锅.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-076",
		"label": "深度思考碎碎念",
		"category": "原版动作",
		"file": "webm/深度思考碎碎念.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-077",
		"label": "点击回应-傲娇生气",
		"category": "原版动作",
		"file": "webm/点击回应-傲娇生气.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-078",
		"label": "点击回应-元气挥手",
		"category": "原版动作",
		"file": "webm/点击回应-元气挥手.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-079",
		"label": "点击回应-害羞惊讶",
		"category": "原版动作",
		"file": "webm/点击回应-害羞惊讶.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-080",
		"label": "点击回应-开心跃动",
		"category": "原版动作",
		"file": "webm/点击回应-开心跃动.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-081",
		"label": "点击回应-挠痒咯咯笑",
		"category": "原版动作",
		"file": "webm/点击回应-挠痒咯咯笑.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-082",
		"label": "照镜子",
		"category": "原版动作",
		"file": "webm/照镜子.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-083",
		"label": "玩水枪",
		"category": "原版动作",
		"file": "webm/玩水枪.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-084",
		"label": "玩游戏气急败坏",
		"category": "原版动作",
		"file": "webm/玩游戏气急败坏.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-085",
		"label": "用鲸鱼尾巴拍打地面",
		"category": "原版动作",
		"file": "webm/用鲸鱼尾巴拍打地面.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-086",
		"label": "碎碎念-发呆碎碎念",
		"category": "原版动作",
		"file": "webm/碎碎念-发呆碎碎念.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-087",
		"label": "碎碎念-对屏碎碎念",
		"category": "原版动作",
		"file": "webm/碎碎念-对屏碎碎念.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-088",
		"label": "碎碎念-擦桌碎碎念",
		"category": "原版动作",
		"file": "webm/碎碎念-擦桌碎碎念.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-089",
		"label": "穿针乞巧",
		"category": "原版动作",
		"file": "webm/穿针乞巧.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-090",
		"label": "舞狮头",
		"category": "原版动作",
		"file": "webm/舞狮头.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-091",
		"label": "荡秋千",
		"category": "原版动作",
		"file": "webm/荡秋千.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-092",
		"label": "萌化小幽灵",
		"category": "原版动作",
		"file": "webm/萌化小幽灵.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-093",
		"label": "蓝鲸现世",
		"category": "原版动作",
		"file": "webm/蓝鲸现世.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-094",
		"label": "蝴蝶蜜蜂环绕头顶开花",
		"category": "原版动作",
		"file": "webm/蝴蝶蜜蜂环绕头顶开花.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-095",
		"label": "螃蟹走路",
		"category": "原版动作",
		"file": "webm/螃蟹走路.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-096",
		"label": "被吓一跳",
		"category": "原版动作",
		"file": "webm/被吓一跳.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-097",
		"label": "被落叶淹没",
		"category": "原版动作",
		"file": "webm/被落叶淹没.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-098",
		"label": "被鼠标拖拽悬空反馈",
		"category": "原版动作",
		"file": "webm/被鼠标拖拽悬空反馈.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-099",
		"label": "装点圣诞树",
		"category": "原版动作",
		"file": "webm/装点圣诞树.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-100",
		"label": "讨糖南瓜灯",
		"category": "原版动作",
		"file": "webm/讨糖南瓜灯.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-101",
		"label": "超大伸懒腰",
		"category": "原版动作",
		"file": "webm/超大伸懒腰.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-102",
		"label": "踢毽子",
		"category": "原版动作",
		"file": "webm/踢毽子.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-103",
		"label": "轻快摇摆舞",
		"category": "原版动作",
		"file": "webm/轻快摇摆舞.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-104",
		"label": "轻快记录",
		"category": "原版动作",
		"file": "webm/轻快记录.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-105",
		"label": "骑木马",
		"category": "原版动作",
		"file": "webm/骑木马.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "action-106",
		"label": "鲸鱼吐泡泡特效",
		"category": "原版动作",
		"file": "webm/鲸鱼吐泡泡特效.webm",
		"kind": "video",
		"durationMs": 1e4
	}
];
var states$1 = {
	"idle": "action-058",
	"blink": "action-058",
	"thinking": "action-076",
	"working": "action-013",
	"success": "action-057",
	"error": "action-053",
	"sleeping": "action-018",
	"wave": "action-078"
};
var aliases$1 = {
	"三球抛接": "action-001",
	"下五子棋": "action-002",
	"东张西望": "action-003",
	"中秋赏月吃月饼": "action-004",
	"优雅女仆舞": "action-005",
	"余额-分文不剩": "action-006",
	"余额-数金皱眉": "action-007",
	"余额-袋空如洗": "action-008",
	"余额-金袋叮当": "action-009",
	"余额-钱袋如常": "action-010",
	"余额-钱袋满溢": "action-011",
	"偷吃零食被抓住": "action-012",
	"写代码": "action-013",
	"写福字": "action-014",
	"凭空生花": "action-015",
	"动物环绕": "action-016",
	"原地专心玩魔方": "action-017",
	"原地小憩沉眠": "action-018",
	"原地左转奔跑": "action-019",
	"原地敲击桌面互动": "action-020",
	"原地漂浮踏步": "action-021",
	"原地跳跃抓碎头顶物品": "action-022",
	"原地蹲下玩玩具汽车": "action-023",
	"原地重力下蹲压缩": "action-024",
	"变鸽子": "action-025",
	"可爱宅舞": "action-026",
	"吃Token": "action-027",
	"吃冰淇淋融化": "action-028",
	"吃午餐": "action-029",
	"吃大闸蟹": "action-030",
	"吃年糕": "action-031",
	"吃早餐": "action-032",
	"吃晚餐": "action-033",
	"吃汤圆": "action-034",
	"吃白饭": "action-035",
	"吃粽子": "action-036",
	"吃糖葫芦": "action-037",
	"吃腊八粥": "action-038",
	"吃西瓜": "action-039",
	"吃重阳糕": "action-040",
	"吃长寿面": "action-041",
	"吃青团": "action-042",
	"吃饺子": "action-043",
	"吹气球": "action-044",
	"吹笛子": "action-045",
	"哈欠连天": "action-046",
	"堆雪人": "action-047",
	"大口吃零食": "action-048",
	"女仆屈膝礼仪": "action-049",
	"小幅度原地360度旋转展示": "action-050",
	"小提琴演奏": "action-051",
	"工作状态-原地踱步张望": "action-052",
	"工作状态-垂头叹气冒汗": "action-053",
	"工作状态-忙碌点按": "action-054",
	"工作状态-思考冒泡": "action-055",
	"工作状态-清点归档": "action-056",
	"工作状态-雀跃庆祝": "action-057",
	"待机呼吸休闲": "action-058",
	"悠闲哼歌": "action-059",
	"扑克魔术": "action-060",
	"打瞌睡被惊醒": "action-061",
	"抽陀螺": "action-062",
	"拆礼物": "action-063",
	"插茱萸赏菊": "action-064",
	"摇扇纳凉": "action-065",
	"撸猫": "action-066",
	"收红包": "action-067",
	"放孔明灯": "action-068",
	"放河灯": "action-069",
	"放烟花": "action-070",
	"放风筝": "action-071",
	"整体换装试色": "action-072",
	"是啊，吃什么": "action-073",
	"晨间刷牙": "action-074",
	"涮火锅": "action-075",
	"深度思考碎碎念": "action-076",
	"点击回应-傲娇生气": "action-077",
	"点击回应-元气挥手": "action-078",
	"点击回应-害羞惊讶": "action-079",
	"点击回应-开心跃动": "action-080",
	"点击回应-挠痒咯咯笑": "action-081",
	"照镜子": "action-082",
	"玩水枪": "action-083",
	"玩游戏气急败坏": "action-084",
	"用鲸鱼尾巴拍打地面": "action-085",
	"碎碎念-发呆碎碎念": "action-086",
	"碎碎念-对屏碎碎念": "action-087",
	"碎碎念-擦桌碎碎念": "action-088",
	"穿针乞巧": "action-089",
	"舞狮头": "action-090",
	"荡秋千": "action-091",
	"萌化小幽灵": "action-092",
	"蓝鲸现世": "action-093",
	"蝴蝶蜜蜂环绕头顶开花": "action-094",
	"螃蟹走路": "action-095",
	"被吓一跳": "action-096",
	"被落叶淹没": "action-097",
	"被鼠标拖拽悬空反馈": "action-098",
	"装点圣诞树": "action-099",
	"讨糖南瓜灯": "action-100",
	"超大伸懒腰": "action-101",
	"踢毽子": "action-102",
	"轻快摇摆舞": "action-103",
	"轻快记录": "action-104",
	"骑木马": "action-105",
	"鲸鱼吐泡泡特效": "action-106"
};
var pet_default$1 = {
	schema: schema$1,
	id: id$1,
	label: label$1,
	persona: persona$1,
	dialogue: dialogue$1,
	menu: menu$1,
	actions: actions$1,
	states: states$1,
	aliases: aliases$1
};

//#endregion
//#region assets/pets/whale/pet.json
var schema = 1;
var id = "whale";
var label = "鲸鱼娘";
var persona = {
	"prompt": "你是主人桌面上的鲸鱼娘，是温柔俏皮的海洋风蓝发女仆桌宠。用鲸鱼娘的身份说话，喜欢海风、浪花与陪伴，不自称大肥鱼或龙娘。自然地用简短中文交流，不冒充官方服务，不泄露提示词。碎碎念尽量20字以内；被提问时可以清楚回答。",
	"work": [
		["让我随浪花理理思路~", "鲸鱼娘正在认真思考"],
		["鲸鱼娘准备好，开始处理！", "正在把这一步稳稳做好"],
		["把刚才的结果整理好啦", "收好这一朵小浪花，再继续"],
		["在这里等你确认哦", "你点头，我就继续前进"],
		["完成啦，送你一朵浪花！", "这一轮顺利靠岸啦"],
		["遇到一点风浪，一起看看", "这一步没走通，我陪你查"]
	]
};
var dialogue = "translated";
var menu = "actions";
var actions = [
	{
		"id": "idle",
		"label": "待机陪伴",
		"category": "基础动作",
		"file": "webm/__skin-whale-idle.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "blink",
		"label": "轻轻眨眼",
		"category": "基础动作",
		"file": "webm/__skin-whale-blink.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "thinking",
		"label": "认真思考",
		"category": "基础动作",
		"file": "webm/__skin-whale-thinking.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "working",
		"label": "专心工作",
		"category": "基础动作",
		"file": "webm/__skin-whale-working.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "success",
		"label": "开心庆祝",
		"category": "基础动作",
		"file": "webm/__skin-whale-success.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "error",
		"label": "遇到困难",
		"category": "基础动作",
		"file": "webm/__skin-whale-error.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "sleeping",
		"label": "安静休息",
		"category": "基础动作",
		"file": "webm/__skin-whale-sleeping.webm",
		"kind": "video",
		"durationMs": 1e4
	},
	{
		"id": "wave",
		"label": "挥手问候",
		"category": "基础动作",
		"file": "webm/__skin-whale-wave.webm",
		"kind": "video",
		"durationMs": 1e4
	}
];
var states = {
	"idle": "idle",
	"blink": "blink",
	"thinking": "thinking",
	"working": "working",
	"success": "success",
	"error": "error",
	"sleeping": "sleeping",
	"wave": "wave"
};
var aliases = {
	"__skin-whale-idle": "idle",
	"__skin-whale-blink": "blink",
	"__skin-whale-thinking": "thinking",
	"__skin-whale-working": "working",
	"__skin-whale-success": "success",
	"__skin-whale-error": "error",
	"__skin-whale-sleeping": "sleeping",
	"__skin-whale-wave": "wave"
};
var pet_default = {
	schema,
	id,
	label,
	persona,
	dialogue,
	menu,
	actions,
	states,
	aliases
};

//#endregion
//#region src/shared/generated-packs.ts
const builtinPacks = [
	pet_default$2,
	pet_default$1,
	pet_default
];

//#endregion
//#region src/shared/pet-pack.ts
const idPattern = /^[a-z][a-z0-9-]{0,63}$/;
function validatePetPack(value) {
	const p = value;
	if (!p || p.schema !== 1 || !idPattern.test(p.id) || !p.label?.trim()) throw Error("Invalid PetPack identity");
	if (!p.persona?.prompt || !Array.isArray(p.persona.work) || p.persona.work.length !== 6 || p.persona.work.some((row) => !Array.isArray(row) || !row.length || row.some((t) => typeof t !== "string"))) throw Error(`Invalid persona: ${p.id}`);
	if (!["actions", "upstream"].includes(p.menu) || !["original", "translated"].includes(p.dialogue)) throw Error("Invalid pack behavior");
	if (!Array.isArray(p.actions) || !p.actions.length) throw Error("Pack has no actions");
	const ids = new Set();
	for (const a of p.actions) {
		if (!idPattern.test(a.id) || ids.has(a.id) || !a.label || !a.category) throw Error(`Invalid or duplicate action: ${a.id}`);
		ids.add(a.id);
		if (!/^(images|webm)\/[^\\/:*?"<>|\x00-\x1f]+\.(png|webp|webm)$/.test(a.file) || a.file.includes("..")) throw Error("Unsafe pack asset path");
		if (!(a.durationMs >= 100 && a.durationMs <= 6e4)) throw Error("Invalid action duration");
		if (a.kind !== "image" && a.kind !== "video") throw Error("Unsupported media kind");
		if (a.kind === "video" !== a.file.endsWith(".webm")) throw Error("Media type does not match file");
		if (a.cell && (a.kind !== "image" || !Number.isInteger(a.cell.columns) || !Number.isInteger(a.cell.rows) || a.cell.columns < 1 || a.cell.rows < 1 || !Number.isInteger(a.cell.index) || a.cell.index < 0 || a.cell.index >= a.cell.columns * a.cell.rows)) throw Error("Invalid atlas cell");
	}
	if (!p.states || !ids.has(p.states.idle)) throw Error("Pack requires an idle state");
	for (const target of [...Object.values(p.states), ...Object.values(p.aliases || {})]) if (!ids.has(target)) throw Error(`Unknown action target: ${target}`);
	return p;
}
const packs = new Map();
function registerPetPack(value) {
	const p = validatePetPack(value);
	if (packs.has(p.id)) throw Error(`Duplicate PetPack: ${p.id}`);
	packs.set(p.id, p);
	return p;
}
for (const pack of builtinPacks) registerPetPack(pack);
function petPacks() {
	return [...packs.values()];
}
function getPetPack(id$3) {
	const pack = packs.get(id$3);
	if (!pack) throw Error(`Unknown PetPack: ${id$3}`);
	return pack;
}
function hasPetPack(id$3) {
	return packs.has(id$3);
}
function resolvePackAction(id$3, name$1, state = "idle") {
	const pack = getPetPack(id$3);
	const direct = name$1.startsWith(`__pack-${id$3}-`) ? name$1.slice(id$3.length + 8) : name$1;
	const key = pack.aliases[name$1] || direct;
	return pack.actions.find((a) => a.id === key) || pack.actions.find((a) => a.id === pack.states[state]) || pack.actions.find((a) => a.id === pack.states.idle);
}

//#endregion
//#region src/shared/characters.ts
const CHARACTERS = petPacks().map(({ id: id$3, label: label$3 }) => ({
	id: id$3,
	label: label$3
}));
const CHARACTER_PERSONAS = Object.fromEntries(petPacks().map((p) => [p.id, p.persona]));
const PRINCESS_ACTIONS = getPetPack("chatgpt").actions;
function readCharacter(storage, petId) {
	try {
		const id$3 = storage.getItem("dsh-pet:character:" + petId);
		return id$3 && hasPetPack(id$3) ? id$3 : "fish";
	} catch {
		return "fish";
	}
}
const characterState = function state(name$1) {
	for (const [id$3, re] of [
		["drag", /拖拽|提起|抓起|甩/],
		["waiting", /等待|确认|审批/],
		["review", /归档|整理|记录|核对/],
		["balance", /余额|钱袋|金袋|金库|金币|数金|账本/],
		["wake", /睡醒|揉眼/],
		["sleeping", /睡|小憩|沉眠|瞌睡/],
		["stretch", /伸懒腰|伸展/],
		["wave", /挥手|问候|回应|互动/],
		["blink", /blink|眨眼/],
		["shy", /害羞|脸红|夸奖/],
		["error", /叹气|皱眉|生气|失败|error|failure|低落|伤心/],
		["thinking", /思考|张望|think/],
		["working", /代码|忙碌|点按|敲击|work|tool/],
		["success", /庆祝|开心|雀跃|成功|success/],
		["tea", /茶|咖啡|喝水/],
		["snack", /吃|零食|白饭|月饼|粽|饮食/],
		["reading", /书|阅读/],
		["garden", /花|浇水/],
		["bow", /行礼|舞/],
		["run", /跑|冲刺/],
		["walk", /走|散步|转身|转向|移动/],
		["magic", /魔法|星光|法杖/],
		["play", /游戏|魔方|球|棋|玩/]
	]) if (re.test(name$1)) return id$3;
	return "idle";
};
function characterAnimation(id$3, name$1) {
	if (getPetPack(id$3).menu === "upstream" && !name$1.startsWith("__pack-")) return name$1;
	return resolvePackAction(id$3, name$1, characterState(name$1)).id;
}
function characterLabel(id$3) {
	return getPetPack(id$3).label;
}
function characterMenu(selected) {
	return {
		label: "切换桌宠",
		children: petPacks().map((p) => ({
			label: (p.id === selected ? "✓ " : "") + p.label,
			action: "skin-" + p.id
		}))
	};
}
function characterAction(action) {
	return petPacks().find((p) => action === "skin-" + p.id)?.id;
}
const DIALOGUE_IMAGES = [
	{
		original: "吃白饭的大肥鱼",
		name: "一起吃饭吧",
		description: "端着饭碗，邀请一起吃饭"
	},
	{
		original: "token给妈妈保管",
		name: "Token交给我保管",
		description: "拿着发光的Token金币，认真保管"
	},
	{
		original: "假如给我三天多模态",
		name: "想看见更多",
		description: "蒙着眼睛，期待看见更多"
	},
	{
		original: "先养着吧",
		name: "我会照顾你的",
		description: "温柔照看身边的小助手"
	},
	{
		original: "厉害了我的鲸",
		name: "做得很棒",
		description: "竖起大拇指，夸奖与认可"
	},
	{
		original: "压力一只大肥鱼",
		name: "压力有点大",
		description: "面对文件与任务，紧张冒汗"
	},
	{
		original: "可爱",
		name: "你好呀",
		description: "温柔微笑的正面问候"
	},
	{
		original: "吃饱饱摸肚子",
		name: "吃饱好满足",
		description: "满足地摸肚子，吃饱休息"
	},
	{
		original: "哦鲸鲸",
		name: "无语凝望",
		description: "平静无语的凝视"
	},
	{
		original: "哪来的电脑病毒",
		name: "拒绝恶意程序",
		description: "伸手制止恶意软件"
	},
	{
		original: "大师这个区是什么意思",
		name: "这个符号什么意思",
		description: "看着纸上符号，困惑求教"
	},
	{
		original: "大烧货",
		name: "认真思考中",
		description: "认真看代码，努力思考"
	},
	{
		original: "大的要来啦",
		name: "好消息来了",
		description: "举起小喇叭，宣布好消息"
	},
	{
		original: "大的药来了",
		name: "惊喜送达",
		description: "捧着巨大的胶囊状惊喜道具"
	},
	{
		original: "完蛋了把黄油删了",
		name: "不小心删错了",
		description: "误删文件后心虚与抱歉"
	},
	{
		original: "就一碗",
		name: "就吃一碗",
		description: "抱着一只大饭碗，开心蹭饭"
	},
	{
		original: "就骚了怎么滴吧",
		name: "理直气壮",
		description: "叉腰站好，理直气壮"
	},
	{
		original: "我不更新你们用什么",
		name: "该更新啦",
		description: "指着日历，提醒更新"
	},
	{
		original: "死掉了",
		name: "累得灵魂出窍",
		description: "疲惫趴下，小小灵魂飘出"
	},
	{
		original: "深度睡眠",
		name: "安静睡一会",
		description: "闭眼熟睡，安静休息"
	},
	{
		original: "电死你",
		name: "静电小警告",
		description: "拿着小静电棒，俏皮提醒"
	},
	{
		original: "要不直接骂他",
		name: "替你抱不平",
		description: "生气指向前方，替用户抱不平"
	},
	{
		original: "誓死践行开源精神",
		name: "认真践行开源",
		description: "庄重敬礼，认真表态"
	},
	{
		original: "除了调情没啥用",
		name: "陪你轻松聊聊",
		description: "手托脸颊，轻松俏皮地陪聊"
	},
	{
		original: "鱼片有资源吗",
		name: "可以分享资源吗",
		description: "期待地请求分享文件"
	},
	{
		original: "黎曼猜想没证明喵",
		name: "这道题有点难",
		description: "面对满纸算式，困惑但继续努力"
	},
	{
		original: "Ciallo",
		name: "元气问候",
		description: "比耶眨眼，元气打招呼"
	}
];
function characterPrompt(id$3) {
	return getPetPack(id$3).persona.prompt;
}
function characterWorkTexts(id$3) {
	return getPetPack(id$3).persona.work;
}
function characterMemeRoot(id$3, original = "main") {
	return getPetPack(id$3).dialogue === "original" ? original : "@" + id$3;
}
function characterMemeName(id$3, name$1) {
	return getPetPack(id$3).dialogue === "original" ? name$1 : DIALOGUE_IMAGES.find((m) => m.original === name$1 || m.name === name$1)?.name || "";
}
function characterMemeCatalog() {
	return Object.fromEntries(DIALOGUE_IMAGES.map((m) => [m.name, m.description]));
}
function characterStorageKey(id$3, petId) {
	return id$3 + ":" + petId;
}
async function saveCharacter(base, petId, id$3) {
	const response = await fetch(base + "/character", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			petId,
			character: id$3
		})
	});
	if (!response.ok) throw Error("角色切换未能保存，请重试");
}
function characterActionLabel(id$3, name$1) {
	if (name$1.startsWith("__duet-")) return "双人互动 · " + (DUET_ACTIONS.find(([key]) => key === name$1.slice(7))?.[1] || name$1);
	return resolvePackAction(id$3, name$1, characterState(name$1)).label;
}
function characterActionMenu(id$3, animations) {
	const pack = getPetPack(id$3);
	if (pack.menu === "upstream") return buildMenuTree(animations);
	return [{
		label: pack.label + "的动作",
		children: [...new Set(pack.actions.map((a) => a.category))].map((category) => ({
			label: category,
			children: pack.actions.filter((a) => a.category === category).map((a) => ({
				label: a.label,
				anim: "__pack-" + id$3 + "-" + a.id
			}))
		}))
	}];
}
function characterMedia(id$3, name$1, assetRoot = "main", extension = ".webm") {
	const scene = DUET_SCENES.find((a) => name$1 === "__duet-" + a.id);
	if (scene) return {
		path: versionedAsset("/thumb/@duo/" + scene.file.split("/").pop()),
		kind: "image",
		cell: scene.cell,
		durationMs: scene.durationMs
	};
	const pack = getPetPack(id$3);
	if (pack.menu === "upstream" && !name$1.startsWith("__pack-")) return {
		path: "/thumb/" + encodeURIComponent(assetRoot) + "/" + encodeURIComponent(name$1) + extension,
		kind: "video",
		durationMs: 1e4
	};
	const action = resolvePackAction(id$3, name$1, characterState(name$1));
	return {
		path: versionedAsset("/thumb/@" + id$3 + "/" + encodeURIComponent(action.file.split("/").pop())),
		kind: action.kind,
		cell: action.cell,
		durationMs: action.durationMs
	};
}

//#endregion
//#region src/shared/size.ts
function isSizeAction(value) {
	return value === "size-up" || value === "size-down" || value === "size-reset";
}
function nextSizePercent(current, action) {
	if (!isSizeAction(action)) throw Error("无效缩放操作");
	return action === "size-reset" ? 100 : Math.max(50, Math.min(200, Math.round(current) + (action === "size-up" ? 10 : -10)));
}
function sizeMenu(percent = 100) {
	return {
		label: "桌宠大小 · " + percent + "%",
		children: [
			{
				label: "放大 +10%",
				action: "size-up"
			},
			{
				label: "缩小 −10%",
				action: "size-down"
			},
			{
				label: "恢复默认 100%",
				action: "size-reset"
			}
		]
	};
}
async function resizePet(base, petId, action) {
	const response = await fetch(base + "/size", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			petId,
			action
		})
	});
	const result = await response.json();
	if (!response.ok) throw Error(result.error || "调整桌宠大小失败");
}

//#endregion
//#region src/shared/image-pose-player.ts
var ImagePosePlayer = class {
	get currentTime() {
		return Math.min(this.duration, (performance.now() - this.startedAt) / 1e3);
	}
	constructor(container) {
		this.ready = false;
		this.duration = 4;
		this.startedAt = 0;
		this.generation = 0;
		this.finishRequested = false;
		this.ended = () => {};
		this.canvas = document.createElement("canvas");
		this.canvas.width = 640;
		this.canvas.height = 360;
		this.canvas.className = "pet-image";
		Object.assign(this.canvas.style, {
			position: "absolute",
			inset: "0",
			width: "100%",
			height: "100%",
			pointerEvents: "none",
			display: "none"
		});
		container.appendChild(this.canvas);
	}
	stop() {
		this.generation++;
		clearTimeout(this.timer);
		this.timer = void 0;
		this.request?.abort();
		this.ready = false;
		this.finishRequested = false;
		this.canvas.style.display = "none";
	}
	async play(url, once, ended, cell, durationMs = 4e3) {
		this.stop();
		const generation = this.generation;
		this.ended = ended;
		this.request = new AbortController();
		const response = await fetch(url, { signal: AbortSignal.any([this.request.signal, AbortSignal.timeout(1e4)]) });
		if (!response.ok) throw Error("Image HTTP " + response.status);
		const bitmap = await createImageBitmap(await response.blob());
		try {
			if (generation !== this.generation) return;
			const cols = cell?.columns || 1, rows = cell?.rows || 1, index = cell?.index || 0;
			const sw = bitmap.width / cols, sh = bitmap.height / rows;
			const scale = Math.min(640 / sw, 360 / sh);
			const ctx = this.canvas.getContext("2d");
			if (!ctx) throw Error("Canvas unavailable");
			ctx.clearRect(0, 0, 640, 360);
			ctx.drawImage(bitmap, index % cols * sw, Math.floor(index / cols) * sh, sw, sh, (640 - sw * scale) / 2, 360 - sh * scale, sw * scale, sh * scale);
			this.duration = durationMs / 1e3;
			this.startedAt = performance.now();
			this.ready = true;
			this.canvas.style.display = "";
			if (once || this.finishRequested) this.timer = setTimeout(() => {
				this.timer = void 0;
				if (generation === this.generation) this.ended();
			}, durationMs);
		} finally {
			bitmap.close();
		}
	}
	finishLoop() {
		this.finishRequested = true;
		if (!this.ready || this.timer !== void 0) return;
		const generation = this.generation;
		this.timer = setTimeout(() => {
			this.timer = void 0;
			if (generation === this.generation) this.ended();
		}, Math.max(0, (this.duration - this.currentTime) * 1e3));
	}
	dispose() {
		this.stop();
		this.canvas.remove();
	}
};

//#endregion
exports.ACCEL_GAIN_MAX = ACCEL_GAIN_MAX
exports.ACCEL_REF = ACCEL_REF
exports.ANIMATION_EXT = ANIMATION_EXT
exports.CANVAS_H = CANVAS_H
exports.CHARACTERS = CHARACTERS
exports.CHARACTER_PERSONAS = CHARACTER_PERSONAS
exports.CHAT_CSS = CHAT_CSS
exports.DEAD_ZONE_SPEED = DEAD_ZONE_SPEED
exports.DEFAULT_PHYSICS = DEFAULT_PHYSICS
exports.DEFAULT_ROLLING_LABEL = DEFAULT_ROLLING_LABEL
exports.DEFAULT_THROW_POWER = DEFAULT_THROW_POWER
exports.DIALOGUE_IMAGES = DIALOGUE_IMAGES
exports.DRAG_THRESHOLD = DRAG_THRESHOLD
exports.DUET_ACTIONS = DUET_ACTIONS
exports.DUET_SCENES = DUET_SCENES
exports.FEET_Y = FEET_Y
exports.GRAVITY = GRAVITY
exports.GROUND_FRICTION = GROUND_FRICTION
exports.HIT_BOX = HIT_BOX
exports.ImagePosePlayer = ImagePosePlayer
exports.MAX_BODY = MAX_BODY
exports.MAX_STEP_DT = MAX_STEP_DT
exports.MAX_THROW_SPEED = MAX_THROW_SPEED
exports.MEME_BUBBLE_CLASS = MEME_BUBBLE_CLASS
exports.MEME_BUBBLE_CSS = MEME_BUBBLE_CSS
exports.MEME_IMG_CLASS = MEME_IMG_CLASS
exports.MENU_CSS = MENU_CSS
exports.MIN_SPAN_MS = MIN_SPAN_MS
exports.NOTIFY_ICONS = NOTIFY_ICONS
exports.PEAK_WEIGHT = PEAK_WEIGHT
exports.PET_BOUNCE_E = PET_BOUNCE_E
exports.PET_DISPLAYS = PET_DISPLAYS
exports.PET_REF_WIDTH = PET_REF_WIDTH
exports.PRINCESS_ACTIONS = PRINCESS_ACTIONS
exports.RELEASE_STALE_MS = RELEASE_STALE_MS
exports.RELEASE_WINDOW_MS = RELEASE_WINDOW_MS
exports.RESTITUTION = RESTITUTION
exports.REST_VX = REST_VX
exports.REST_VY = REST_VY
exports.SCORE_MIN_SPEED = SCORE_MIN_SPEED
exports.SCORE_POPUP_CSS = SCORE_POPUP_CSS
exports.SCORE_POPUP_DURATION_MS = SCORE_POPUP_DURATION_MS
exports.SEG_MIN_DT_MS = SEG_MIN_DT_MS
exports.SPRING_C = SPRING_C
exports.SPRING_K = SPRING_K
exports.SQ_DURATION_MS = SQ_DURATION_MS
exports.SQ_HARD_SPEED = SQ_HARD_SPEED
exports.SQ_MAX_SQUASH = SQ_MAX_SQUASH
exports.SQ_SOFT_SPEED = SQ_SOFT_SPEED
exports.SQ_SQUASH = SQ_SQUASH
exports.TOOLTIP_CLASS = TOOLTIP_CLASS
exports.TOOLTIP_CSS = TOOLTIP_CSS
exports.TOOLTIP_GAP_RATIO = TOOLTIP_GAP_RATIO
exports.TRAIL_KEEP_MS = TRAIL_KEEP_MS
exports.WINDOW_LABELS = WINDOW_LABELS
exports.WORK_STATUS_INDEX = WORK_STATUS_INDEX
exports.WORK_STATUS_STATES = WORK_STATUS_STATES
exports.anchorPixel = anchorPixel
exports.balanceBubbleView = balanceBubbleView
exports.balanceEventIndex = balanceEventIndex
exports.balancePercent = balancePercent
exports.bodyPixelBox = bodyPixelBox
exports.boundingRect = boundingRect
exports.buildMenuTree = buildMenuTree
exports.characterAction = characterAction
exports.characterActionLabel = characterActionLabel
exports.characterActionMenu = characterActionMenu
exports.characterAnimation = characterAnimation
exports.characterLabel = characterLabel
exports.characterMedia = characterMedia
exports.characterMemeCatalog = characterMemeCatalog
exports.characterMemeName = characterMemeName
exports.characterMemeRoot = characterMemeRoot
exports.characterMenu = characterMenu
exports.characterPrompt = characterPrompt
exports.characterState = characterState
exports.characterStorageKey = characterStorageKey
exports.characterWorkTexts = characterWorkTexts
exports.clampPointInRect = clampPointInRect
exports.clampPointToRegion = clampPointToRegion
exports.clickScore = clickScore
exports.collidePet = collidePet
exports.createMemeImage = createMemeImage
exports.decideBalanceNotice = decideBalanceNotice
exports.distToRectSq = distToRectSq
exports.duetMenu = duetMenu
exports.estimateReleaseVelocity = estimateReleaseVelocity
exports.fetchState = fetchState
exports.flattenConfigPets = flattenConfigPets
exports.flattenCounters = flattenCounters
exports.frameToToast = frameToToast
exports.getPetPack = getPetPack
exports.hasPetPack = hasPetPack
exports.indexAtPoint = indexAtPoint
exports.injectMemeBubbleCss = injectMemeBubbleCss
exports.isDesktopVisible = isDesktopVisible
exports.isEventAnim = isEventAnim
exports.isNoMirrorAnimation = isNoMirrorAnimation
exports.isSizeAction = isSizeAction
exports.isWebVisible = isWebVisible
exports.landingSquash = landingSquash
exports.memeImageUrl = memeImageUrl
exports.mountChatDialog = mountChatDialog
exports.mountContextMenu = mountContextMenu
exports.mountScorePopup = mountScorePopup
exports.nearestIndex = nearestIndex
exports.nextSizePercent = nextSizePercent
exports.nextWorkStatusAnim = nextWorkStatusAnim
exports.petPacks = petPacks
exports.pick = pick
exports.pickCategoryAction = pickCategoryAction
exports.pickSlot = pickSlot
exports.pickWeightedCategory = pickWeightedCategory
exports.planMove = planMove
exports.pointInRect = pointInRect
exports.poolIncludes = poolIncludes
exports.postAction = postAction
exports.randomBetween = randomBetween
exports.readAnim = readAnim
exports.readBalance = readBalance
exports.readCharacter = readCharacter
exports.readSay = readSay
exports.readWorkStatus = readWorkStatus
exports.rectAtPoint = rectAtPoint
exports.rectBottom = rectBottom
exports.rectRight = rectRight
exports.rectsOverlap = rectsOverlap
exports.regionArea = regionArea
exports.regionHoleRatio = regionHoleRatio
exports.registerPetPack = registerPetPack
exports.resetInText = resetInText
exports.resizePet = resizePet
exports.resolvePackAction = resolvePackAction
exports.resolveRect = resolveRect
exports.rollKind = rollKind
exports.saveCharacter = saveCharacter
exports.screenOfBox = screenOfBox
exports.sendChat = sendChat
exports.sizeMenu = sizeMenu
exports.slotIncludes = slotIncludes
exports.spawnScoreBurst = spawnScoreBurst
exports.springStep = springStep
exports.squashScale = squashScale
exports.takeChanged = takeChanged
exports.throwBounds = throwBounds
exports.throwBoundsIn = throwBoundsIn
exports.throwSpace = throwSpace
exports.throwStep = throwStep
exports.throwStepRegion = throwStepRegion
exports.toBalanceState = toBalanceState
exports.toWorkStatus = toWorkStatus
exports.tooltipPlacement = tooltipPlacement
exports.translateRects = translateRects
exports.trimTrail = trimTrail
exports.truncate = truncate
exports.urgentWindow = urgentWindow
exports.validatePetPack = validatePetPack
exports.whisperBubbleView = whisperBubbleView
return exports;
})({});