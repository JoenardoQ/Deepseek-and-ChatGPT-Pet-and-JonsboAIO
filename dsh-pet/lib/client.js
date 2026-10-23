;(()=>{

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
const pointInRect = (r, x, y) => x >= r.x && x < rectRight(r) && y >= r.y && y < rectBottom(r);
const rectAtPoint = (rects, x, y) => {
	for (const r of rects) if (pointInRect(r, x, y)) return r;
	return null;
};

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

//#endregion
//#region src/shared/size.ts
function isSizeAction(value) {
	return value === "size-up" || value === "size-down" || value === "size-reset";
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
var exports = {
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
	exports,
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
function characterWorkTexts(id$3) {
	return getPetPack(id$3).persona.work;
}
function characterMemeRoot(id$3, original = "main") {
	return getPetPack(id$3).dialogue === "original" ? original : "@" + id$3;
}
function characterMemeName(id$3, name$1) {
	return getPetPack(id$3).dialogue === "original" ? name$1 : DIALOGUE_IMAGES.find((m) => m.original === name$1 || m.name === name$1)?.name || "";
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
//#region src/shared/config.ts
const PET_DISPLAYS = [
	"web",
	"desktop",
	"both",
	"none"
];
const isWebVisible = (display) => display === "web" || display === "both";
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

//#endregion
//#region src/client/bubble.ts
/** 气泡内联样式：白色半透明圆润泡 + 底部小尾巴指向宠物；字体用上首软糖体（本地打包，稳定）。
* 所有尺寸基于 `--dsh-pet-size`（宠物宽度 px）等比缩放——宠物放大/缩小，气泡跟随。
* 系数按默认 462px 设计：21px 字号 → ×0.0455、120px 最小宽 → 0.26、230px 最大宽 → 0.5 等。 */
const bubbleCss = [
	"@font-face{font-family:\"ShangshouSoftCandy\";src:url(\"/dsh-pet-7340/font/上首软糖体.ttf\") format(\"truetype\");font-display:swap;font-weight:400}",
	".dsh-pet-bubble{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(100% - var(--dsh-pet-size)*0.108);min-width:calc(var(--dsh-pet-size)*0.26);max-width:calc(var(--dsh-pet-size)*0.5);padding:calc(var(--dsh-pet-size)*0.022) calc(var(--dsh-pet-size)*0.030);border-radius:calc(var(--dsh-pet-size)*0.035);background:rgba(255,255,255,.92);color:#2b2b2b;font-family:\"ShangshouSoftCandy\",\"Yuanti SC\",\"YouYuan\",\"幼圆\",\"Comic Sans MS\",\"PingFang SC\",\"Microsoft YaHei\",sans-serif;font-size:calc(var(--dsh-pet-size)*0.0455);line-height:1.6;z-index:3;pointer-events:none;box-shadow:0 calc(var(--dsh-pet-size)*0.009) calc(var(--dsh-pet-size)*0.035) rgba(0,0,0,.14),0 1px 3px rgba(0,0,0,.08);backdrop-filter:blur(6px);opacity:0;transition:opacity .25s ease;white-space:nowrap}",
	".dsh-pet-bubble::after{content:\"\";position:absolute;left:50%;bottom:calc(var(--dsh-pet-size)*-0.017);transform:translateX(-50%);border:calc(var(--dsh-pet-size)*0.017) solid transparent;border-top-color:rgba(255,255,255,.92);border-bottom:none}",
	".dsh-pet-bubble.is-on{opacity:1}",
	".dsh-pet-bubble.dsh-pet-whisper{font-size:calc(var(--dsh-pet-size)*0.034);min-width:calc(var(--dsh-pet-size)*0.10);max-width:calc(var(--dsh-pet-size)*0.5);white-space:normal;overflow-wrap:anywhere}",
	".dsh-pet-bubble .pet-bub-title{font-size:calc(var(--dsh-pet-size)*0.035);color:rgba(43,43,43,.6);margin-bottom:calc(var(--dsh-pet-size)*0.009)}",
	".dsh-pet-bubble .pet-bub-row{display:flex;justify-content:space-between;gap:calc(var(--dsh-pet-size)*0.030)}",
	".dsh-pet-bubble .pet-bub-sub{font-size:calc(var(--dsh-pet-size)*0.035);color:rgba(43,43,43,.6)}",
	".dsh-pet-bubble .pet-bub-val{font-variant-numeric:tabular-nums;font-weight:650;color:#1f1f1f}",
	".dsh-pet-bubble .pet-bub-err{color:#d94f3d;font-size:calc(var(--dsh-pet-size)*0.035)}",
	".dsh-pet-bubble .pet-bub-tag{margin-left:calc(var(--dsh-pet-size)*0.013);font-size:calc(var(--dsh-pet-size)*0.022);color:rgba(43,43,43,.55);border:1px solid rgba(43,43,43,.25);border-radius:calc(var(--dsh-pet-size)*0.013);padding:0 calc(var(--dsh-pet-size)*0.009);vertical-align:1px}",
	".dsh-pet-bubble .pet-bub-tier{font-weight:700}",
	".dsh-pet-bubble .pet-bub-tier-peak{color:#e53935}",
	".dsh-pet-bubble .pet-bub-tier-idle{color:#2e9e4f}"
].join("\n");
/** 只注入一次 */
function injectBubbleCss() {
	if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"dsh-pet/bubble\"]") === null) {
		const tag = document.createElement("style");
		tag.dataset.plugin = "dsh-pet";
		tag.dataset.pluginCss = "dsh-pet/bubble";
		tag.textContent = bubbleCss;
		document.head.appendChild(tag);
	}
}
/** 行数据 → React 节点（shared 视图的薄壳） */
function rowsToNodes(h, rows) {
	if (rows.some((r) => r.role === "tier")) return h("div", {
		className: "pet-bub-row",
		children: rows.map((r, i) => {
			if (r.role === "tier") return h("span", {
				key: i,
				className: "pet-bub-tier pet-bub-tier-" + r.tier,
				children: r.text
			});
			return h("span", {
				key: i,
				children: r.text
			});
		})
	});
	return rows.map((r, i) => {
		if (r.role === "error") return h("div", {
			key: i,
			className: "pet-bub-err",
			children: r.text
		});
		if (r.role === "sub") return h("div", {
			key: i,
			className: "pet-bub-row pet-bub-sub",
			children: r.text
		});
		return h("div", {
			key: i,
			className: "pet-bub-row",
			children: r.text
		});
	});
}
function makeBalanceBubble(rt) {
	const { h } = rt;
	injectBubbleCss();
	return function BalanceBubble({ state, on }) {
		const rows = balanceBubbleView(state);
		const wrap = state.ok ? "" : " dsh-pet-whisper";
		return h("div", {
			className: "dsh-pet-bubble" + wrap + (on ? " is-on" : ""),
			children: rowsToNodes(h, rows)
		});
	};
}
function makeWhisperBubble(rt) {
	const { h } = rt;
	injectBubbleCss();
	injectMemeBubbleCss();
	return function WhisperBubble({ text, image, assetRoot, on }) {
		const rows = whisperBubbleView({
			ok: true,
			text,
			ts: 0
		});
		const key = String(image ?? "").trim();
		return h("div", {
			className: "dsh-pet-bubble dsh-pet-whisper" + (key ? " " + MEME_BUBBLE_CLASS : "") + (on ? " is-on" : ""),
			children: key ? [h("img", {
				key: "img",
				className: MEME_IMG_CLASS,
				src: memeImageUrl(key, "/dsh-pet-7340", assetRoot),
				alt: key
			}), rowsToNodes(h, rows)] : rowsToNodes(h, rows)
		});
	};
}

//#endregion
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
//#region src/client/settings-styles.ts
const SETTINGS_CSS = [
	".dsh-pet-mp{position:relative;min-width:0;display:flex;flex-direction:column;gap:4px}",
	".dsh-pet-mp__trigger{display:flex;align-items:center;gap:6px;width:100%;max-width:340px;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;text-align:left;cursor:pointer;outline:none}",
	".dsh-pet-mp__trigger:hover:not(:disabled){border-color:var(--dsw-alias-state-business-primary)}",
	".dsh-pet-mp__trigger:focus-visible{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}",
	".dsh-pet-mp__trigger:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}",
	".dsh-pet-mp__label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}",
	".dsh-pet-mp__sub{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0;flex-shrink:1000;color:var(--dsw-alias-label-caption,var(--dsw-alias-label-tertiary))}",
	".dsh-pet-mp__chevron{flex:none;margin-left:auto;color:var(--dsw-alias-label-caption,var(--dsw-alias-label-tertiary));transition:transform .12s}",
	".dsh-pet-mp__chevron.is-open{transform:rotate(180deg)}",
	".dsh-pet-mp__panel{position:fixed;z-index:2147483000;display:flex;flex-direction:column;gap:4px;padding:4px;overflow:hidden;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-md,10px);background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-prominent,0 8px 30px rgba(0,0,0,.35));color:var(--dsw-alias-label-primary)}",
	".dsh-pet-mp__search{box-sizing:border-box;width:100%;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:13px;outline:none}",
	".dsh-pet-mp__search:focus{border-color:var(--dsw-alias-state-business-primary)}",
	".dsh-pet-mp__list{display:flex;flex-direction:column;min-height:0;overflow-y:auto;scrollbar-width:thin}",
	".dsh-pet-mp__group{padding:6px 8px 2px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-tertiary)}",
	".dsh-pet-mp__item{display:flex;align-items:center;gap:8px;width:100%;padding:6px 8px;border:none;border-radius:var(--dsw-radius-sm,6px);background:transparent;color:inherit;font-size:13px;line-height:20px;text-align:left;cursor:pointer}",
	".dsh-pet-mp__item:hover:not(:disabled),.dsh-pet-mp__item.is-active{background:var(--dsw-alias-interactive-bg-hover)}",
	".dsh-pet-mp__item[aria-checked=\"true\"]{color:var(--dsw-alias-state-business-primary)}",
	".dsh-pet-mp__item:disabled{color:var(--dsw-alias-label-dimmed);cursor:default}",
	".dsh-pet-mp__name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}",
	".dsh-pet-mp__check{flex:none;margin-left:auto}",
	".dsh-pet-mp__status{padding:8px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}",
	".dsh-pet-cfg{container-type:inline-size;display:flex;flex-direction:column;gap:12px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}",
	".dsh-pet-cfg__title{display:flex;align-items:center;gap:6px;margin:0;font-size:16px;font-weight:500;line-height:24px}",
	".dsh-pet-cfg__card{display:flex;flex-direction:column;gap:10px;padding:12px 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px}",
	".dsh-pet-cfg__cardHead{display:flex;align-items:center;gap:6px;min-height:20px}",
	".dsh-pet-cfg__cardTitle{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}",
	".dsh-pet-cfg__grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 16px;align-items:end}",
	".dsh-pet-cfg__grid4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px 16px;align-items:end}",
	".dsh-pet-cfg__grid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;align-items:end}",
	"@container (max-width:600px){.dsh-pet-cfg__grid4{grid-template-columns:repeat(2,minmax(0,1fr))}}",
	"@container (max-width:400px){.dsh-pet-cfg__grid2,.dsh-pet-cfg__grid3,.dsh-pet-cfg__grid4{grid-template-columns:minmax(0,1fr)}}",
	".dsh-pet-cfg__field{display:flex;flex-direction:column;gap:4px;min-width:0}",
	".dsh-pet-cfg__flabel{display:inline-flex;align-items:center;gap:5px;font-size:12px;color:var(--dsw-alias-label-secondary)}",
	".dsh-pet-cfg__inp{box-sizing:border-box;width:100%;min-height:28px;padding:4px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;outline:none}",
	".dsh-pet-cfg__inp:focus{border-color:var(--dsw-alias-state-business-primary)}",
	".dsh-pet-cfg__inp:disabled{color:var(--dsw-alias-label-tertiary);cursor:default}",
	".dsh-pet-cfg__toggle{display:flex;align-items:center;gap:6px;min-width:0;font-size:13px;color:var(--dsw-alias-label-primary)}",
	".dsh-pet-cfg__toggle>label{display:inline-flex;align-items:center;gap:6px;cursor:pointer;min-width:0}",
	".dsh-pet-cfg__toggle>label>span{overflow-wrap:anywhere}",
	".dsh-pet-cfg__toggle input[type=checkbox]{flex:none;width:16px;height:16px;margin:0;accent-color:var(--dsw-alias-state-business-primary);cursor:pointer}",
	".dsh-pet-cfg__q{position:relative;display:inline-flex;align-items:center;justify-content:center;flex:none;width:14px;height:14px;border:1px solid var(--dsw-alias-label-tertiary);border-radius:50%;color:var(--dsw-alias-label-tertiary);font-size:10px;font-style:normal;line-height:1;cursor:help;user-select:none}",
	".dsh-pet-cfg__q::after{display:none;content:attr(data-tip);position:absolute;left:-4px;bottom:calc(100% + 8px);width:max-content;max-width:260px;padding:6px 10px;border-radius:8px;background:var(--dsw-alias-tooltip-bg);color:#fff;font-size:12px;font-style:normal;font-weight:400;line-height:18px;text-align:left;white-space:normal;opacity:0;visibility:hidden;pointer-events:none;transition:opacity .12s ease;box-shadow:0 6px 20px rgba(0,0,0,.22);z-index:2147483000}",
	".dsh-pet-cfg__q:hover::after{display:block;opacity:1;visibility:visible}",
	".dsh-pet-cfg__q.is-end::after{left:auto;right:-4px}",
	".dsh-pet-cfg__btn{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);border-radius:8px;padding:4px 14px;font:inherit;font-size:12px;line-height:20px;cursor:pointer;white-space:nowrap}",
	".dsh-pet-cfg__btn:hover:not(:disabled):not(.is-primary){background:var(--dsw-alias-interactive-bg-hover)}",
	".dsh-pet-cfg__btn:disabled{opacity:.5;cursor:default}",
	".dsh-pet-cfg__btn.is-primary{border-color:var(--dsw-alias-button-info-fill);background:var(--dsw-alias-button-info-fill);color:#fff}",
	".dsh-pet-cfg__btn.is-primary:hover:not(:disabled){border-color:var(--dsw-alias-button-info-hover);background:var(--dsw-alias-button-info-hover)}",
	".dsh-pet-cfg__btn.is-danger{border-color:var(--dsw-alias-state-error-secondary);color:var(--dsw-alias-state-error-primary)}",
	".dsh-pet-cfg__btn.is-sm{padding:2px 10px}",
	".dsh-pet-cfg__btn.is-ghost{border-style:dashed;color:var(--dsw-alias-label-secondary)}",
	".dsh-pet-cfg__tabs{display:flex;gap:8px;flex-wrap:wrap;align-items:center}",
	".dsh-pet-cfg__tabsLabel{font-size:12px;color:var(--dsw-alias-label-secondary)}",
	".dsh-pet-cfg__tab{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);border-radius:8px;padding:4px 12px;font:inherit;font-size:13px;cursor:pointer}",
	".dsh-pet-cfg__tab:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}",
	".dsh-pet-cfg__tab:disabled{opacity:.5;cursor:default}",
	".dsh-pet-cfg__tab.is-active{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-active)}",
	".dsh-pet-cfg__tab.is-ghost{border-style:dashed;color:var(--dsw-alias-label-secondary)}",
	".dsh-pet-cfg__actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px}",
	".dsh-pet-cfg__msg{margin-left:4px;font-size:12px;color:var(--dsw-alias-state-success-primary)}",
	".dsh-pet-cfg__msg.is-err{color:var(--dsw-alias-state-error-primary)}",
	".dsh-pet-cfg__note{margin:0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-tertiary)}",
	".dsh-pet-cfg__path{font-size:12px;line-height:18px;word-break:break-all;user-select:text;color:var(--dsw-alias-label-secondary)}",
	".dsh-pet-cfg__path b{color:var(--dsw-alias-label-primary);font-weight:400}",
	".dsh-pet-cfg__cmd{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,\"Courier New\",monospace;font-size:12px;line-height:18px;word-break:break-all;user-select:text;padding:6px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-interactive-bg-active);color:var(--dsw-alias-label-primary)}"
].join("\n");
const settingsCssTag = "dsh-pet/settings.css";
function injectSettingsCss() {
	if (typeof document === "undefined") return;
	if (document.querySelector("style[data-plugin-css=\"" + settingsCssTag + "\"]") !== null) return;
	const tag = document.createElement("style");
	tag.dataset.plugin = "dsh-pet";
	tag.dataset.pluginCss = settingsCssTag;
	tag.textContent = SETTINGS_CSS;
	document.head.appendChild(tag);
}

//#endregion
//#region src/client/settings-locales.ts
const zh = {
	nav: "桌宠配置",
	intro: "管理多个桌宠：每个宠物可独立设置大小与位置（保存后即时生效）。",
	petCardTitle: "宠物配置",
	petCardHint: "每只宠物独立配置：名字 / 大小 / 显示位置 / 位置 / 偏移 / 四个功能开关。改完点最下面的「保存」即时生效。",
	globalTitle: "全局开关",
	globalHint: "所有宠物共用（pet pack 可在自己种类文件里单独覆盖）。这几个开关只改本地状态，随「保存」整包写入用户配置（不做即时写入）；系统通知在保存后即时重读，无需刷新页面。",
	cornerHint: "宠物贴着屏幕的哪个角（桌面端按各自显示器的工作区算）。",
	marginXHint: "距所选角落的水平距离（px），可为任意数字。",
	marginYHint: "距所选角落的垂直距离（px），可为任意数字。",
	"cmd.chat": "对话",
	"cmd.pet": "桌宠",
	"cmd.balance": "余额",
	petsLabel: "宠物列表",
	add: "添加宠物",
	remove: "删除",
	confirmRemove: "确定删除宠物「{id}」吗？",
	confirmTitle: "确认操作",
	cancel: "取消",
	ok: "知道了",
	atLeastOne: "至少保留一个宠物。",
	emptyPets: "暂无宠物，点击「添加宠物」创建。",
	sizeLabel: "大小（宽度 px）",
	sizeHint: "高度自动 = 宽度 × 9/16。",
	nameLabel: "名字",
	nameHint: "显示名：鼠标悬浮宠物时弹出，也会加进 AI 人设（你的名字是 X）。可重复，留空按宠物 id 处理。",
	balanceEnabled: "余额功能",
	balanceEnabledHint: "启用后该宠物触发余额动画并显示余额气泡。",
	whisperEnabled: "碎碎念",
	whisperEnabledHint: "启用后该宠物按周期用 AI 生成一句话并播碎碎念动画（人设与周期在配置文件顶层）。",
	workStatusEnabled: "工作状态联动",
	workStatusEnabledHint: "启用后该宠物跟随 DSH 工作状态：思考/工作中/等待确认/完成/出错时自动切对应动画并弹气泡（动画池在配置顶层，仅监听不调用模型）。",
	fixedEnabled: "宠物固定",
	fixedEnabledHint: "启用后随机动画不再让宠物自己转向或走开，只播原地待机与随机小动作；右键菜单点播、接口触发、余额/碎碎念/工作状态动画不受影响。",
	displayLabel: "显示位置",
	displayHint: "web=仅浏览器 / desktop=仅桌面 / both=两者都显示 / none=都不显示",
	"display.web": "仅浏览器",
	"display.desktop": "仅桌面",
	"display.both": "两者都显示",
	"display.none": "都不显示",
	cornerLabel: "位置",
	"corner.top-left": "左上角",
	"corner.top-right": "右上角",
	"corner.bottom-left": "左下角",
	"corner.bottom-right": "右下角",
	marginX: "水平偏移",
	marginY: "垂直偏移",
	save: "保存",
	sync: "同步",
	confirmSync: "确定同步吗？将用项目内置的默认配置（完整字段 + 注释）覆盖用户配置，当前的自定义内容会丢失。",
	corruptTitle: "用户配置已损坏，未保存",
	corruptConfirm: "强行保存",
	corruptBody: "用户配置文件解析不了（内容已损坏，不是合法 JSON/JSONC）：{path}。继续保存会按白名单重建这个文件——它里面现有的内容（animations / physics / memes 等自定义字段）会全部丢失。取消 = 不动文件（先去把配置改回合法再保存）；确认 = 强行保存（丢弃文件里现有的内容）。",
	syncHint: "「同步」会把项目内置的默认配置（含注释与全部高级字段）写入用户配置文件，覆盖当前自定义内容；之后可直接编辑该文件。注意两点：① 文件一旦生成即为显式覆盖层——插件升级后内置默认的变化不会自动生效（除非再次同步或删除该文件）；② 在本页点「保存」会按白名单重写该文件（字段值保留，但注释会被去掉）。",
	configMeta: "高级配置（文件）",
	configMetaHint: "用户配置可覆盖宠物列表 / 动画池 / 播放权重，修改后刷新或重启生效：浏览器端刷新页面，桌面端右键宠物 →「重载配置」（重载全部桌面宠物窗口）；默认配置为完整参考。",
	defaultConfig: "默认配置（只读，完整参考）",
	userConfig: "用户配置（自定义覆盖）",
	animationDir: "动画素材目录（可自定义/扩充动画）",
	memesDir: "表情包目录（可自定义/扩充配图）",
	saved: "已保存，桌宠即时生效。",
	loadError: "加载配置失败",
	loading: "正在加载配置…",
	retry: "重试",
	invalid: "请检查输入：大小需为正数，边距可为任意数字。",
	busy: "保存中…",
	extraPetsHint: "另 {n} 只额外宠物由 pet/ 目录文件定义（<名>-config.json + <名>-animation/ + <名>-memes/），它们不在此列表——改文件后浏览器刷新页面、桌面端右键「重载配置」即可生效。",
	notifyToggle: "系统通知",
	notifyToggleHint: "对话完成 / 生成失败 / 权限申请 / 用户选择，在窗口失焦时弹出系统级通知（桌面右下角）。",
	whisperImageToggle: "碎碎念配图",
	whisperImageToggleHint: "碎碎念时从表情包池随机抽一张，连同那句话一起显示（图片映射在配置文件顶层 memes）。token：碎碎念本来就每次生成都要调一次模型，配图只是把抽中那张的名称+描述（约 100 字符 / ≈60 token）加进同一次请求，增量可忽略。",
	chatImageToggle: "对话配图",
	chatImageToggleHint: "对话时由 AI 按当前语境从表情包池挑一张配图（可不挑；图片映射在配置文件顶层 memes）。token：每条消息都要把整张清单附进请求，当前约 1.1k 字符（≈650 token，约碎碎念配图的 11 倍），并随图片数量线性增长；关掉则一个字符都不附。",
	confineToggle: "抛掷锁定在当前屏幕",
	confineToggleHint: "多屏用户：甩出去的宠物只在松手时所在那块屏幕内弹（屏缝当墙，不飞到隔壁屏）；关掉则照常跨屏飞行。只影响桌面模式——浏览器 overlay 本来就只在视口内弹。",
	physicsTitle: "物理（拖拽抛掷手感）",
	physicsHint: "全局默认，所有宠物共用（pet pack 可在自己种类文件里单独覆盖）；随「保存」写入用户配置（不做即时写入）。浏览器保存后即时生效，桌面端由保存重载宠物窗口后生效。",
	"physics.gravity": "重力 gravity",
	"physics.gravityHint": "px/s²，越大落得越快；0 = 无重力（抛出去匀速直线飞）",
	"physics.restitution": "弹性 restitution",
	"physics.restitutionHint": "0~1，碰壁 / 落地反弹保留的速度比例（1 = 完全弹性，0 = 撞上即停）",
	"physics.groundFriction": "地面摩擦 groundFriction",
	"physics.groundFrictionHint": "/s，落地后水平速度的衰减率；0 = 冰面不减速",
	"physics.throwPower": "总力度 throwPower",
	"physics.throwPowerHint": "> 0，弹簧跟手与甩出初速的整体倍率（1 = 默认；越大越跟手、甩得越猛）",
	physicsCeilingBounce: "顶部反弹 ceilingBounce",
	physicsCeilingBounceHint: "关掉后抛掷可飞出屏幕顶部（重力仍会把它拉回来）",
	physicsPetCollision: "宠物互撞 petCollision",
	physicsPetCollisionHint: "飞行中的宠物撞到别的宠物按动量守恒弹开（质量 ∝ 尺寸²）",
	invalidPhysics: "请检查物理参数：重力 / 地面摩擦 ≥ 0，弹性 0~1，总力度 > 0。",
	modelTitle: "AI 模型与对话上下文",
	modelHint: "碎碎念与对话各自用哪个模型，以及对话每次带多少历史进上下文。选「跟随当前对话」= 用你当前对话正在用的那个模型（默认）。全局默认：对所有宠物生效，pet pack 可在自己种类文件里单独覆盖。选项与 DSH 的模型选择器同源，由宿主实时提供。",
	modelFollow: "跟随当前对话",
	modelSearch: "搜索模型…",
	modelEmpty: "没有匹配的模型。",
	modelNoModels: "没有可用的模型。",
	modelLoading: "正在刷新模型列表…",
	modelTriggerAria: "选择模型，当前 {model}",
	modelUnknown: "（当前配置，不在列表中）",
	modelNone: "该服务商没有可用模型",
	whisperModelLabel: "碎碎念模型",
	chatModelLabel: "对话模型",
	modelFieldHint: "选「跟随当前对话」= 用当前对话的模型；指定了但调用失败会自动回落到当前对话的模型重试一次。",
	invalidModel: "请检查模型设置：服务商与模型要么都选，要么都留空（跟随当前对话）。",
	modelCatalogFailed: "模型列表加载失败（刷新页面可重试）；当前配置值仍会原样保留。",
	chatMemory: "对话历史条数",
	chatMemoryHint: "每次对话请求携带的最近历史轮数（1 轮 = 1 问 1 答；0 = 不带历史，每句都是全新对话）。对话记忆本身全存不删，此值只决定截多少进上下文——越大越记得住，也越费 token。全局默认，所有宠物共用（pet pack 可在自己种类文件里单独覆盖）。",
	invalidChatMemory: "请检查对话历史条数：需为 ≥ 0 的数字。",
	chatImageLimit: "对话配图张数上限",
	chatImageLimitHint: "对话时发给模型的表情包清单最多几张（「前 N 张」= 配置里写在前面的那 N 条，想让哪几张优先被发出去就把顺序往前挪）。整张清单是每条消息都要附的，token 随张数线性增长——张数一多就是纯烧钱，限制成前 N 张，模型只从这几张里挑。0 = 不限制（全部发）。内置默认 10。全局默认，所有宠物共用（pet pack 可在自己种类文件里覆盖）。只影响对话选图：碎碎念只带抽中的那一张。",
	invalidChatImageLimit: "请检查对话配图张数上限：需为 ≥ 0 的数字（0 = 不限制）。",
	notifyTest: "测试弹窗",
	notifyTestOk: "测试通知已发送，请查看桌面右下角。",
	notifyDenyUnsupported: "当前环境不支持系统通知（浏览器无 Notification API）。",
	notifyDenyBlocked: "通知权限已被浏览器标记为「阻止」。",
	notifyDenyRejected: "你在权限询问弹窗中选择了「阻止」。",
	notifyDenyError: "申请权限时出错",
	notifyGuide: "引导：点击地址栏左侧 🔒/ⓘ →「网站设置」→「通知」→ 改为「允许」，刷新页面后重试。",
	storageTitle: "卸载与存储",
	storageHint: "插件在本机落下的全部位置。删缓存不影响使用（会自动重下/重建）；删「插件用户数据」会丢配置与对话记忆。",
	"storage.userData": "插件用户数据：自定义配置 main-config.jsonc、对话记忆 memory.json、自定义动画素材 main-animation/、文件宠物 pet/",
	"storage.electron": "桌面宠物用的 Electron 运行时（体积较大；删除后下次启用桌面模式会自动重新下载）",
	"storage.desktopCache": "桌面宠物窗口的缓存与主屏缩放缓存（可删，会自动重建）",
	"storage.electronCache": "Electron 安装包下载缓存（可删，需要时会重新下载）",
	"storage.package": "插件本体（由 DSH 管理，用下面的卸载命令移除，不要手删）",
	storageMissing: "（尚未创建）",
	uninstallTitle: "卸载方法",
	uninstallStep1: "1. 先退出 DSH（桌面宠物随之退出）；不要在桌宠运行时删除上面的文件。",
	uninstallStep2: "2. 卸载插件本体（终端执行，会同时从 profile 的 bundle 层移除）：",
	uninstallStep3: "3. 按需删除上面的位置：缓存类删了无影响；「插件用户数据」删了会丢配置与对话记忆（想保留就先备份其中的 main-config.jsonc）。",
	uninstallCmd: "dsh plugin --profile {profile} remove dsh-pet"
};
const en = {
	nav: "Pet Config",
	intro: "Manage multiple pets: each pet has its own size and position (applies instantly after saving).",
	petCardTitle: "Pet",
	petCardHint: "Per-pet settings: name / size / display / corner / offsets / the four feature switches. Click \"Save\" at the bottom to apply instantly.",
	globalTitle: "Global switches",
	globalHint: "Shared by every pet (a pet pack may override them in its own kind file). These switches only change local state and are written to the user config on \"Save\" (never written immediately); system notifications re-read right after saving, no page refresh needed.",
	cornerHint: "Which screen corner the pet sticks to (per-monitor work area in desktop mode).",
	marginXHint: "Horizontal distance from the chosen corner (px); any number.",
	marginYHint: "Vertical distance from the chosen corner (px); any number.",
	"cmd.chat": "Chat",
	"cmd.pet": "Pet",
	"cmd.balance": "Balance",
	petsLabel: "Pets",
	add: "Add pet",
	remove: "Remove",
	confirmRemove: "Delete pet \"{id}\"?",
	confirmTitle: "Confirm action",
	cancel: "Cancel",
	ok: "Got it",
	atLeastOne: "Keep at least one pet.",
	emptyPets: "No pets yet — click \"Add pet\" to create one.",
	sizeLabel: "Size (width px)",
	sizeHint: "Height is automatic = width × 9/16.",
	nameLabel: "Name",
	nameHint: "Shown on hover and added to AI personas (\"your name is X\"). Duplicates allowed; empty falls back to the pet id.",
	balanceEnabled: "Balance",
	balanceEnabledHint: "When enabled, this pet plays balance animations and shows the balance bubble.",
	whisperEnabled: "Whisper",
	whisperEnabledHint: "When enabled, this pet periodically generates a line via AI and plays the whisper animation (persona & interval live in the top-level config).",
	workStatusEnabled: "Work status",
	workStatusEnabledHint: "When enabled, this pet follows DSH work state: thinking / working / waiting / done / error switch animations and show bubbles (pool in top-level config; listening only, no model calls).",
	fixedEnabled: "Pin in place",
	fixedEnabledHint: "When enabled, the random chain no longer turns this pet or walks it away — only idle and in-place actions play. Right-click picks, API triggers and balance / whisper / work-status animations are unaffected.",
	displayLabel: "Display",
	displayHint: "web = browser only / desktop = desktop only / both = both / none = neither",
	"display.web": "Browser only",
	"display.desktop": "Desktop only",
	"display.both": "Both",
	"display.none": "Neither",
	cornerLabel: "Position",
	"corner.top-left": "Top-left",
	"corner.top-right": "Top-right",
	"corner.bottom-left": "Bottom-left",
	"corner.bottom-right": "Bottom-right",
	marginX: "Horizontal offset",
	marginY: "Vertical offset",
	save: "Save",
	sync: "Sync",
	confirmSync: "Sync? This overwrites the user config with the bundled default config (all fields + comments); current customizations are lost.",
	corruptTitle: "User config is corrupted — not saved",
	corruptConfirm: "Save anyway",
	corruptBody: "The user config file cannot be parsed (corrupted, not valid JSON/JSONC): {path}. Saving now rebuilds it from the whitelist — everything currently in that file (animations / physics / memes …) will be lost. Cancel = leave the file untouched (fix it and save again); Confirm = save anyway (discard what is in the file).",
	syncHint: "\"Sync\" writes the bundled default config (comments + every advanced field included) to the user config file, overwriting your current customizations; the file is then directly editable. Two caveats: (1) once created, that file is an explicit override layer — later changes to the bundled defaults will not take effect automatically (until you sync again or delete the file); (2) clicking \"Save\" on this page rewrites the file from a whitelist — field values are kept, comments are dropped.",
	configMeta: "Advanced (files)",
	configMetaHint: "User config may override pets / animation pools / weights — refresh or restart to apply: refresh the page in the browser, or right-click a desktop pet → \"Reload config\" (rebuilds every desktop pet window). The default config is the complete reference.",
	defaultConfig: "Default config (read-only, complete reference)",
	userConfig: "User config (custom overrides)",
	animationDir: "Animation assets dir (add/customize animations here)",
	memesDir: "Meme images dir (add/customize images here)",
	saved: "Saved — the pets updated instantly.",
	loadError: "Failed to load config",
	loading: "Loading config…",
	retry: "Retry",
	invalid: "Check your input: size must be positive; margins can be any number.",
	busy: "Saving…",
	extraPetsHint: "{n} extra pet(s) are file-defined in the pet/ directory (<name>-config.json + <name>-animation/ + <name>-memes/). They are not in this list — after editing the files, refresh the page (browser) or right-click a desktop pet → \"Reload config\".",
	notifyToggle: "System notifications",
	notifyToggleHint: "OS-level toasts (bottom-right of the desktop) for conversation completion, failures, permission requests, and questions — only while this window is unfocused.",
	whisperImageToggle: "Whisper images",
	whisperImageToggleHint: "Attach one random meme from the pool to each whisper line (image mapping lives in the top-level `memes` config field). Tokens: a whisper already calls the model every cycle, so the image only appends the name + description of that one meme (~100 chars / ~60 tokens) to the same request — negligible.",
	chatImageToggle: "Chat images",
	chatImageToggleHint: "Let the AI pick one meme from the pool that fits the current context (optional; mapping lives in the top-level `memes` config field). Tokens: every message carries the whole catalog — currently ~1.1k chars (~650 tokens, about 11x the whisper case) and growing with the number of images; turning this off appends nothing at all.",
	confineToggle: "Lock throws to the current screen",
	confineToggleHint: "Multi-monitor: a thrown pet bounces only inside the screen it was released on (screen seams act as walls, so it never flies to the neighbouring monitor); turn this off to let it cross screens as usual. Desktop only — the browser overlay always bounces inside the viewport anyway.",
	physicsTitle: "Physics (drag & throw feel)",
	physicsHint: "Global default, shared by every pet (a pet pack may override it in its own kind file); written to the user config on \"Save\" (never written immediately). Applies instantly in the browser; on the desktop it applies once Save reloads the pet windows.",
	"physics.gravity": "Gravity",
	"physics.gravityHint": "px/s² — the higher, the faster it falls; 0 = weightless (flies straight forever)",
	"physics.restitution": "Bounciness",
	"physics.restitutionHint": "0–1, speed kept when bouncing off a wall or the floor (1 = perfectly elastic, 0 = stops dead)",
	"physics.groundFriction": "Ground friction",
	"physics.groundFrictionHint": "per second, horizontal damping while on the ground; 0 = frictionless ice",
	"physics.throwPower": "Throw power",
	"physics.throwPowerHint": "> 0, overall multiplier for spring tracking and release speed (1 = default; higher = tighter tracking, harder throws)",
	physicsCeilingBounce: "Ceiling bounce",
	physicsCeilingBounceHint: "Turn this off to let a throw fly out through the top of the screen (gravity still pulls it back)",
	physicsPetCollision: "Pet collisions",
	physicsPetCollisionHint: "A flying pet bounces off the others with momentum conservation (mass ∝ size²)",
	invalidPhysics: "Check the physics values: gravity / ground friction ≥ 0, bounciness 0–1, throw power > 0.",
	modelTitle: "AI models & chat context",
	modelHint: "Which model each of whisper and chat uses, and how much history every chat request carries. \"Follow current conversation\" uses the model your current conversation is on (default). Global default: applies to every pet, and a pet pack may override it in its own kind file. The options come from the same source as the DSH model picker, served live by the host.",
	modelFollow: "Follow current conversation",
	modelSearch: "Search models…",
	modelEmpty: "No matching models.",
	modelNoModels: "No models available.",
	modelLoading: "Refreshing model list…",
	modelTriggerAria: "Select model, current {model}",
	modelUnknown: " (current config, not in the list)",
	modelNone: "No models available for this provider",
	whisperModelLabel: "Whisper model",
	chatModelLabel: "Chat model",
	modelFieldHint: "\"Follow current conversation\" uses the conversation model; if a chosen model fails, the plugin falls back to the conversation model and retries once.",
	invalidModel: "Check the model settings: pick both a provider and a model, or leave both empty (follow the current conversation).",
	modelCatalogFailed: "Failed to load the model list (refresh the page to retry); your current values are kept as they are.",
	chatMemory: "Chat history rounds",
	chatMemoryHint: "How many recent rounds each chat request carries (1 round = 1 question + 1 answer; 0 = no history, every message starts fresh). The memory itself keeps everything — this only decides how much goes into the context: higher remembers more and costs more tokens. Global default, shared by every pet (a pet pack may override it in its own kind file).",
	invalidChatMemory: "Check the chat history rounds: it must be a number ≥ 0.",
	chatImageLimit: "Chat image limit",
	chatImageLimitHint: "How many memes at most are listed to the model during chat (\"first N\" = the first N you wrote in the config, so move the ones you want sent to the front). That whole list is attached to every message and tokens grow linearly with the count, so a long list is pure burn; capping it to the first N makes the model pick only among those. 0 = no limit (send everything). Built-in default 10. Global default, shared by every pet (a pet pack may override it in its own kind file). Chat only — a whisper carries just the one meme it drew.",
	invalidChatImageLimit: "Check the chat image limit: it must be a number ≥ 0 (0 = no limit).",
	notifyTest: "Test notification",
	notifyTestOk: "Test notification sent — check the bottom-right of your desktop.",
	notifyDenyUnsupported: "System notifications are not supported in this environment (no Notification API).",
	notifyDenyBlocked: "Notification permission is blocked by the browser.",
	notifyDenyRejected: "You chose \"Block\" in the permission prompt.",
	notifyDenyError: "Failed to request permission",
	notifyGuide: "Guide: click the 🔒/ⓘ icon next to the address bar → Site settings → Notifications → set to \"Allow\", then refresh and retry.",
	storageTitle: "Uninstall & storage",
	storageHint: "Every location this plugin writes to. Deleting cache folders is harmless (they re-download / rebuild); deleting \"plugin user data\" loses your config and chat memory.",
	"storage.userData": "Plugin user data: custom config main-config.jsonc, chat memory memory.json, custom animation assets main-animation/, file pets pet/",
	"storage.electron": "Electron runtime used by the desktop pet (large; re-downloaded automatically the next time desktop mode starts)",
	"storage.desktopCache": "Desktop pet window cache and primary-monitor scale cache (safe to delete, rebuilt automatically)",
	"storage.electronCache": "Electron installer download cache (safe to delete, re-downloaded when needed)",
	"storage.package": "The plugin itself (managed by DSH — remove it with the command below instead of deleting it)",
	storageMissing: " (not created yet)",
	uninstallTitle: "How to uninstall",
	uninstallStep1: "1. Quit DSH first (the desktop pet exits with it); do not delete these files while the pet is running.",
	uninstallStep2: "2. Remove the plugin itself (run in a terminal; this also drops it from the profile bundle layer):",
	uninstallStep3: "3. Delete the locations above as needed: cache folders are harmless; deleting \"plugin user data\" loses your config and chat memory (back up main-config.jsonc first if you want to keep it).",
	uninstallCmd: "dsh plugin --profile {profile} remove dsh-pet"
};

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
//#region src/shared/notify.ts
const NOTIFY_ICONS$1 = {
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
				icon: NOTIFY_ICONS$1.done
			};
			if (kind === "error") return {
				title: "生成失败",
				body: ev.data?.reason?.error?.message ?? "",
				icon: NOTIFY_ICONS$1.error
			};
			if (kind === "max-tokens") return {
				title: "输出被截断",
				body: "已达到输出 token 上限",
				icon: NOTIFY_ICONS$1.truncated
			};
			return null;
		}
		case "approval/requested": {
			const toolName = typeof frame.toolName === "string" ? frame.toolName : "";
			const reason = typeof frame.reason === "string" && frame.reason ? frame.reason : "";
			return {
				title: "正在申请权限",
				body: (toolName ? "工具「" + toolName + "」" : "") + (reason ? "：" + reason : ""),
				icon: NOTIFY_ICONS$1.approval
			};
		}
		case "question/requested": {
			const q = Array.isArray(frame.questions) && frame.questions[0]?.question || "";
			return {
				title: "模型在等你回答",
				body: q,
				icon: NOTIFY_ICONS$1.question
			};
		}
		case "host/agent-error": return {
			title: "生成失败",
			body: typeof frame.message === "string" ? frame.message : "",
			icon: NOTIFY_ICONS$1.error
		};
		default: return null;
	}
}

//#endregion
//#region src/client/notify.ts
let pageVisible = typeof document !== "undefined" && !document.hidden;
let pageFocused = typeof document !== "undefined" && document.hasFocus();
function refreshVisible() {
	pageVisible = !document.hidden;
}
function refreshFocused() {
	pageFocused = document.hasFocus();
}
/** 注册聚焦/可见性监听，返回解绑函数 */
function initFocusTracking() {
	if (typeof document === "undefined") return () => {};
	document.addEventListener("visibilitychange", refreshVisible);
	window.addEventListener("focus", refreshFocused);
	window.addEventListener("blur", refreshFocused);
	return () => {
		document.removeEventListener("visibilitychange", refreshVisible);
		window.removeEventListener("focus", refreshFocused);
		window.removeEventListener("blur", refreshFocused);
	};
}
/** 用户是否在看本页（页面可见且持有焦点）——是则跳过通知 */
function isPageActive() {
	return pageVisible && pageFocused;
}
/** 图标 URL（pic 路由由宿主提供：assets/pic → /dsh-pet-7340/pic/<file>） */
const PIC = (name$1) => "/dsh-pet-7340/pic/" + name$1 + ".png";
const NOTIFY_ICONS = {
	done: PIC(NOTIFY_ICONS$1.done),
	error: PIC(NOTIFY_ICONS$1.error),
	truncated: PIC(NOTIFY_ICONS$1.truncated),
	approval: PIC(NOTIFY_ICONS$1.approval),
	question: PIC(NOTIFY_ICONS$1.question),
	test: PIC(NOTIFY_ICONS$1.test)
};
/** 当前生效的总开关（运行中可被 reloadNotifications 更新——设置页保存后即时生效，无需刷新） */
let notifyEnabled = true;
/** 发一条系统通知；总开关关闭 / 环境不支持 / 未授权 / 聚焦本页 时静默跳过。
* 日志（【弹窗】类型：内容）在门之后记录——只有真正发出通知时才记，被门拦下的触发不产生日志。 */
function toast(title, body, icon$1) {
	if (!notifyEnabled) return;
	if (isPageActive()) return;
	if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
	console.log("【弹窗】" + title + (body ? "：" + body : ""));
	try {
		const opts = {};
		if (body) opts.body = truncate(body);
		if (icon$1) opts.icon = icon$1;
		const n = new Notification(title, opts);
		n.onclick = () => {
			window.focus();
			n.close();
		};
	} catch {}
}
/** 帧 → toast 并发出（映射来自 shared；未知帧静默跳过） */
function toastFrame(frame) {
	const t = frameToToast(frame);
	if (!t) return;
	toast(t.title, t.body, PIC(t.icon));
}
async function requestNotificationPermission() {
	if (typeof Notification === "undefined") return {
		ok: false,
		reason: "unsupported"
	};
	if (Notification.permission === "granted") return { ok: true };
	if (Notification.permission === "denied") return {
		ok: false,
		reason: "denied"
	};
	try {
		const p = await Notification.requestPermission();
		if (p === "granted") return { ok: true };
		if (p === "denied") return {
			ok: false,
			reason: "rejected"
		};
		return {
			ok: false,
			reason: "error",
			message: "权限未授予（" + p + "）"
		};
	} catch (e) {
		return {
			ok: false,
			reason: "error",
			message: e instanceof Error ? e.message : String(e)
		};
	}
}
/** 读取系统通知总开关：读成品聚合 main 条目（用户层优先、缺省回落默认，host 已合并好）；
* 拉取/解析失败时不阻塞（默认开启）。 */
async function readNotificationsEnabled() {
	try {
		const r = await fetch("/dsh-pet-7340/config");
		if (!r.ok) return true;
		const d = await r.json().catch(() => null);
		return typeof d?.main?.notificationsEnabled === "boolean" ? d.main.notificationsEnabled : true;
	} catch {
		return true;
	}
}
async function reloadNotifications() {
	notifyEnabled = await readNotificationsEnabled();
}
function notifyFromFrame(frame) {
	toastFrame(frame);
}
function initNotify() {
	readNotificationsEnabled().then((enabled) => {
		notifyEnabled = enabled;
		if (typeof Notification !== "undefined" && enabled && Notification.permission === "default") requestNotificationPermission();
	});
	return initFocusTracking();
}

//#endregion
//#region src/client/settings.ts
const petBridge = {
	current: [],
	reload: () => {},
	template: void 0
};
const NS = "pet.config";
/** 一处「服务商 + 模型」是否合法：**要么都留空（= 跟随当前对话）要么都非空**。
*  与宿主 config.ts 的 modelSelectionValid 同一套规则（非法宿主回 400，这里先就地给红字提示）。 */
const modelPairValid = (m) => m.provider.trim() === "" === (m.model.trim() === "");
function makePetConfigSection(rt) {
	const { h, useState, useEffect, useRef, useCallback, t } = rt;
	injectSettingsCss();
	const CORNERS = [
		"top-left",
		"top-right",
		"bottom-left",
		"bottom-right"
	];
	const cornerLabel = (c) => t("corner." + c);
	const inputClass = "dsh-pet-cfg__inp";
	/** 等宽字体栈（路径与命令展示用；不引外部字体，走系统栈，避免多拉一份资源） */
	const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, \"Courier New\", monospace";
	/** 生成一个未占用的宠物 id（pet-2、pet-3…） */
	const nextId = (list) => {
		let n = 2;
		for (;; n++) {
			const id$3 = "pet-" + n;
			if (!list.some((p) => p.id === id$3)) return id$3;
		}
	};
	/**
	* 问号 + 悬浮说明（本页所有解释小字的唯一去处）。
	*
	* 为什么用 `<i>` 而不是 `<button>`：它只是说明入口，点了不该有任何行为，也不该被
	* Tab 当成操作项；真正的可交互入口是它旁边的输入框 / 开关。说明文字走 `data-tip`
	* 属性，由 SETTINGS_CSS 的 `::after{content:attr(data-tip)}` 画成气泡——CSS 才能
	* 表达 hover / 过渡，行内样式做不到。
	*
	* @param tip 说明正文（已翻译）
	* @param end 是否右对齐气泡（给栅格最右一列用，免得气泡顶出设置页）
	*/
	const q = (tip, end = false) => h("i", {
		className: "dsh-pet-cfg__q" + (end ? " is-end" : ""),
		"data-tip": tip,
		"aria-label": tip,
		role: "img",
		children: "?"
	});
	/** 卡片头：标题 + 问号说明（+ 可选右侧动作，由调用方自行 append） */
	const cardHead = (title, tip, end = false) => h("div", {
		className: "dsh-pet-cfg__cardHead",
		children: [h("span", {
			key: "t",
			className: "dsh-pet-cfg__cardTitle",
			children: title
		}), tip ? q(tip, end) : null]
	});
	/** 一个字段：标签（+ 问号）在上、控件在下 */
	const field = (label$3, control, tip, end = false) => h("div", {
		className: "dsh-pet-cfg__field",
		children: [h("span", {
			key: "l",
			className: "dsh-pet-cfg__flabel",
			children: tip ? [label$3, q(tip, end)] : label$3
		}), control]
	});
	/**
	* 开关的一格：勾选框 + 标题 + 问号。
	* label 为文案键：标题 = t(label)，说明 = t(label + 'Hint')（说明进问号，不再占一行小字）。
	* 说明挂在问号上而不是整格——点标题只切开关，看说明去点问号，两个动作不再抢同一次点击。
	*/
	const toggleCell = (label$3, value, disabled, onToggle, end = false) => h("div", {
		className: "dsh-pet-cfg__toggle",
		children: [h("label", {
			key: "l",
			children: [h("input", {
				key: "i",
				type: "checkbox",
				checked: value,
				disabled,
				onChange: (e) => onToggle(e.target.checked)
			}), h("span", {
				key: "t",
				children: t(label$3)
			})]
		}), q(t(label$3 + "Hint"), end)]
	});
	/**
	* 「模型」单下拉选择器（碎碎念 / 对话各一个实例）——照 DSH 对话框右下角的模型选择器写：
	* 一个触发器按钮（当前模型 + 服务商小字 + 箭头）→ 点开一个浮层：搜索框 + 按服务商分组的
	* 模型清单（选中项打勾），最上面一项是「跟随当前对话」。
	*
	* 与 DSH 那份的对应关系：
	*  - 触发器 aria-haspopup/aria-expanded、浮层 role=menu、分组头 + role=menuitemradio[aria-checked]、
	*    搜索 role=searchbox —— 无障碍语义一致；
	*  - 浮层 position:fixed（脱离设置页滚动容器，不被 overflow 裁掉）+ 外部点击 / Esc 关闭 + 滚动跟随；
	*  - 搜索是**大小写不敏感的有序子序列**匹配（DSH 同款：输入 dsc 能命中 DeepSeek Chat）；
	*  - 数据来自 GET /models（宿主 llm 服务），与 DSH 模型选择器同一份来源。
	*
	* 为什么不用两个 <select>：DSH 自己就是"一个按钮 → 一个浮层里的分组清单"，两个下拉框既占地方，
	* 又容易留下"选了服务商没选模型"的非法组合。这里也**不再提供**"手填模型 id"的退路：
	* 列不出模型的服务商本来也没法调用，列出来只会诱人踩坑。
	*
	* 定义在工厂作用域（而非 PetConfigSection 内）：组件类型必须跨渲染稳定，否则每次渲染都会
	* 重新挂载，浮层状态（打开/搜索词/高亮）会当场丢失。
	*/
	const ModelPicker = (props) => {
		const [open, setOpen] = useState(false);
		const [query, setQuery] = useState("");
		const [active, setActive] = useState(0);
		const [pos, setPos] = useState(null);
		const rootRef = useRef(null);
		const panelRef = useRef(null);
		const groups = props.catalog ?? [];
		const group = groups.find((g) => g.id === props.value.provider);
		const picked = group?.models.find((m) => m.id === props.value.model);
		const isFollow = props.value.provider === "";
		const triggerLabel = isFollow ? t("modelFollow") : picked?.name ?? props.value.model;
		const triggerSub = isFollow ? "" : group?.name ?? props.value.provider + t("modelUnknown");
		const q$1 = query.trim().toLowerCase();
		const hit = (text) => {
			if (q$1 === "") return true;
			let i = 0;
			for (const ch of text.toLowerCase()) {
				if (ch === q$1[i]) i += 1;
				if (i >= q$1.length) return true;
			}
			return false;
		};
		const rows = [];
		if (q$1 === "") rows.push({
			kind: "follow",
			key: "__follow"
		});
		for (const g of groups) {
			const models = g.models.filter((m) => hit(m.name + " " + m.id));
			if (models.length === 0 && !(q$1 === "" && g.models.length === 0)) continue;
			rows.push({
				kind: "group",
				key: g.id,
				name: g.name
			});
			if (models.length === 0) {
				rows.push({
					kind: "none",
					key: g.id + "/__none"
				});
				continue;
			}
			for (const m of models) rows.push({
				kind: "model",
				key: g.id + "/" + m.id,
				provider: g.id,
				model: m
			});
		}
		const selectable = rows.map((r, i) => r.kind === "group" || r.kind === "none" ? -1 : i).filter((i) => i >= 0);
		const commit = (v) => {
			props.onChange(v);
			setOpen(false);
			setQuery("");
		};
		const pick$1 = (row) => {
			if (!row) return;
			if (row.kind === "follow") commit({
				provider: "",
				model: ""
			});
			else if (row.kind === "model") commit({
				provider: row.provider,
				model: row.model.id
			});
		};
		const step = (dir) => {
			if (selectable.length === 0) return;
			const at = selectable.indexOf(active);
			const next = selectable[at < 0 ? 0 : (at + dir + selectable.length) % selectable.length];
			setActive(next);
			panelRef.current?.querySelector("[data-row=\"" + next + "\"]")?.scrollIntoView({ block: "nearest" });
		};
		useEffect(() => {
			if (!open) return;
			const el = rootRef.current;
			const place = () => {
				if (!el) return;
				const r = el.getBoundingClientRect();
				const below = window.innerHeight - r.bottom - 12;
				const above = r.top - 12;
				const width = Math.min(Math.max(r.width, 240), Math.max(200, Math.min(420, window.innerWidth - 16)));
				const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
				const up = below < 240 && above > below;
				setPos(up ? {
					left,
					bottom: window.innerHeight - r.top + 4,
					width,
					maxHeight: Math.min(360, above)
				} : {
					left,
					top: r.bottom + 4,
					width,
					maxHeight: Math.min(360, below)
				});
			};
			place();
			panelRef.current?.querySelector("input")?.focus();
			const onDown = (e) => {
				const target = e.target;
				if (target && (rootRef.current?.contains(target) === true || panelRef.current?.contains(target) === true)) return;
				setOpen(false);
			};
			const onKey = (e) => {
				if (e.key === "Escape") setOpen(false);
			};
			document.addEventListener("mousedown", onDown, true);
			document.addEventListener("keydown", onKey, true);
			window.addEventListener("scroll", place, true);
			window.addEventListener("resize", place);
			return () => {
				document.removeEventListener("mousedown", onDown, true);
				document.removeEventListener("keydown", onKey, true);
				window.removeEventListener("scroll", place, true);
				window.removeEventListener("resize", place);
			};
		}, [open]);
		const toggle = () => {
			if (props.disabled) return;
			if (!open) {
				setQuery("");
				const at = rows.findIndex((r) => r.kind === "model" && r.provider === props.value.provider && r.model.id === props.value.model);
				setActive(at >= 0 ? at : 0);
			}
			setOpen(!open);
		};
		const searchRow = h("input", {
			key: "search",
			type: "text",
			className: "dsh-pet-mp__search",
			role: "searchbox",
			placeholder: t("modelSearch"),
			"aria-label": t("modelSearch"),
			value: query,
			disabled: props.disabled,
			onChange: (e) => {
				setQuery(e.target.value);
				setActive(selectable.length > 0 ? selectable[0] : 0);
			},
			onKeyDown: (e) => {
				if (e.key === "ArrowDown") {
					e.preventDefault();
					step(1);
				} else if (e.key === "ArrowUp") {
					e.preventDefault();
					step(-1);
				} else if (e.key === "Enter") {
					e.preventDefault();
					pick$1(rows[active]);
				}
			}
		});
		const rowNode = (row, index) => {
			if (row.kind === "group") return h("div", {
				key: row.key,
				className: "dsh-pet-mp__group",
				children: row.name
			});
			if (row.kind === "none") return h("div", {
				key: row.key,
				className: "dsh-pet-mp__status",
				children: t("modelNone")
			});
			const checked = row.kind === "follow" ? isFollow : props.value.provider === row.provider && props.value.model === row.model.id;
			return h("button", {
				key: row.key,
				type: "button",
				role: "menuitemradio",
				"aria-checked": checked,
				"data-row": index,
				className: "dsh-pet-mp__item" + (index === active ? " is-active" : ""),
				disabled: props.disabled,
				onClick: () => pick$1(row),
				onMouseMove: () => setActive(index),
				children: [h("span", {
					key: "n",
					className: "dsh-pet-mp__name",
					children: row.kind === "follow" ? t("modelFollow") : row.model.name
				}), h("span", {
					key: "c",
					className: "dsh-pet-mp__check",
					children: checked ? "✓" : ""
				})]
			});
		};
		return h("div", {
			ref: rootRef,
			className: "dsh-pet-mp",
			children: [h("button", {
				key: "trigger",
				type: "button",
				className: "dsh-pet-mp__trigger",
				disabled: props.disabled,
				"aria-haspopup": "menu",
				"aria-expanded": open,
				"aria-label": t("modelTriggerAria").replace("{model}", triggerLabel),
				onClick: toggle,
				children: [
					h("span", {
						key: "l",
						className: "dsh-pet-mp__label",
						children: triggerLabel
					}),
					triggerSub ? h("span", {
						key: "s",
						className: "dsh-pet-mp__sub",
						children: triggerSub
					}) : null,
					h("span", {
						key: "c",
						className: "dsh-pet-mp__chevron" + (open ? " is-open" : ""),
						children: "▾"
					})
				]
			}), open && pos ? h("div", {
				key: "panel",
				ref: panelRef,
				className: "dsh-pet-mp__panel",
				role: "menu",
				"aria-label": props.label,
				style: {
					left: pos.left + "px",
					top: pos.top === void 0 ? void 0 : pos.top + "px",
					bottom: pos.bottom === void 0 ? void 0 : pos.bottom + "px",
					width: pos.width + "px",
					maxHeight: pos.maxHeight + "px"
				},
				children: [searchRow, props.catalog === null ? h("div", {
					key: "loading",
					className: "dsh-pet-mp__status",
					children: props.failed ? t("modelCatalogFailed") : t("modelLoading")
				}) : rows.length === 0 ? h("div", {
					key: "empty",
					className: "dsh-pet-mp__status",
					role: "status",
					children: groups.length === 0 ? t("modelNoModels") : t("modelEmpty")
				}) : h("div", {
					key: "list",
					className: "dsh-pet-mp__list",
					role: "group",
					children: rows.map(rowNode)
				})]
			}) : null]
		});
	};
	return function PetConfigSection() {
		const initPets = petBridge.current.filter((p) => !p.extra);
		const extraCount = petBridge.current.filter((p) => p.extra).length;
		const [pets, setPets] = useState(initPets.map((p) => ({
			...p,
			position: { ...p.position }
		})));
		const [selId, setSelId] = useState(initPets[0]?.id ?? "");
		const [saving, setBusy] = useState(false);
		const [loadState, setLoadState] = useState("loading");
		const [loadAttempt, setLoadAttempt] = useState(0);
		const busy = saving || loadState !== "ready";
		const [msg, setMsg] = useState({
			kind: "",
			text: ""
		});
		const [dialog, setDialog] = useState(null);
		const [paths, setPaths] = useState(null);
		useEffect(() => {
			fetch("/dsh-pet-7340/config/meta").then((r) => r.ok ? r.json() : null).then((p) => setPaths(p)).catch(() => console.warn("[dsh-pet] 读取配置文件路径失败"));
		}, []);
		const [notifyEnabled$1, setNotifyEnabled] = useState(true);
		const [whisperImage, setWhisperImage] = useState(false);
		const [chatImage, setChatImage] = useState(false);
		const [confineScreen, setConfineScreen] = useState(false);
		const [physics, setPhysics] = useState({ ...DEFAULT_PHYSICS });
		const [whisperModel, setWhisperModel] = useState({
			provider: "",
			model: ""
		});
		const [chatModel, setChatModel] = useState({
			provider: "",
			model: ""
		});
		const [chatMemory, setChatMemory] = useState(5);
		const [chatImageLimit, setChatImageLimit] = useState(10);
		const [catalog, setCatalog] = useState(null);
		const [catalogErr, setCatalogErr] = useState(false);
		const [permMsg, setPermMsg] = useState({
			kind: "",
			text: ""
		});
		const applyConfig = useCallback((merged) => {
			const m = merged.main;
			if (!m || !Array.isArray(m.pets)) throw new Error("Invalid config response");
			const loadedPets = m.pets;
			setPets(loadedPets.map((p) => ({
				...p,
				position: { ...p.position }
			})));
			setSelId((id$3) => loadedPets.some((p) => p.id === id$3) ? id$3 : loadedPets[0]?.id ?? "");
			if (typeof m.notificationsEnabled === "boolean") setNotifyEnabled(m.notificationsEnabled);
			if (typeof m.whisperImageEnabled === "boolean") setWhisperImage(m.whisperImageEnabled);
			if (typeof m.chatImageEnabled === "boolean") setChatImage(m.chatImageEnabled);
			if (typeof m.confineToScreen === "boolean") setConfineScreen(m.confineToScreen);
			if (m.physics && typeof m.physics === "object") setPhysics({
				...DEFAULT_PHYSICS,
				...m.physics
			});
			const wm = m.whisperModel;
			if (wm && typeof wm.provider === "string" && typeof wm.model === "string") setWhisperModel({
				provider: wm.provider,
				model: wm.model
			});
			const cm = m.chatModel;
			if (cm && typeof cm.provider === "string" && typeof cm.model === "string") setChatModel({
				provider: cm.provider,
				model: cm.model
			});
			const cmr = Number(m.chatMemoryRounds);
			if (Number.isFinite(cmr) && cmr >= 0) setChatMemory(cmr);
			const cil = Number(m.chatImageLimit);
			if (Number.isFinite(cil) && cil >= 0) setChatImageLimit(cil);
		}, []);
		useEffect(() => {
			let alive = true;
			const controller = new AbortController();
			fetch("/dsh-pet-7340/config", { signal: controller.signal }).then((r) => {
				if (!r.ok) throw new Error("HTTP " + r.status);
				return r.json();
			}).then((merged) => {
				if (!alive) return;
				applyConfig(merged);
				setLoadState("ready");
			}).catch(() => {
				if (alive) setLoadState("error");
			});
			return () => {
				alive = false;
				controller.abort();
			};
		}, [applyConfig, loadAttempt]);
		useEffect(() => {
			let alive = true;
			fetch("/dsh-pet-7340/models").then((r) => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status))).then((d) => {
				if (!alive) return;
				if (d && Array.isArray(d.providers)) setCatalog(d.providers);
				else setCatalogErr(true);
			}).catch(() => {
				if (alive) setCatalogErr(true);
			});
			return () => {
				alive = false;
			};
		}, []);
		const toggleNotify = async (v) => {
			setNotifyEnabled(v);
			if (v) await requestNotificationPermission();
		};
		/**
		* 「测试弹窗」按钮：发一条测试系统通知，验证整条链路通不通。
		*
		* 顺带承担申请权限的职责——没授权时先申请（借这次用户手势，无手势的自动申请可能被浏览器
		* 静默压制），授权成功再发测试通知。所以这一个按钮同时是「拿权限」和「验链路」的入口，
		* 不需要再单独摆一个「获取权限」按钮。
		*/
		const testNotification = async () => {
			setPermMsg({
				kind: "",
				text: ""
			});
			const r = await requestNotificationPermission();
			if (!r.ok) {
				const reason = r.reason === "unsupported" ? t("notifyDenyUnsupported") : r.reason === "denied" ? t("notifyDenyBlocked") : r.reason === "rejected" ? t("notifyDenyRejected") : t("notifyDenyError") + (r.message ? "：" + r.message : "");
				setPermMsg({
					kind: "err",
					text: reason + (r.reason === "unsupported" ? "" : " " + t("notifyGuide"))
				});
				return;
			}
			try {
				new Notification("测试通知", {
					body: "【dsh-pet】系统通知已就绪。",
					icon: NOTIFY_ICONS.test
				});
			} catch {}
			setPermMsg({
				kind: "ok",
				text: t("notifyTestOk")
			});
		};
		const cur = pets.find((p) => p.id === selId) ?? null;
		const updateSel = (patch) => setPets((list) => list.map((p) => {
			if (p.id !== selId) return p;
			const { position: posPatch,...rest } = patch;
			return {
				...p,
				...rest,
				position: posPatch ? {
					...p.position,
					...posPatch
				} : p.position
			};
		}));
		const validated = () => {
			for (const p of pets) if (!Number.isFinite(p.size) || p.size <= 0 || !Number.isFinite(p.position.marginX) || !Number.isFinite(p.position.marginY)) {
				setMsg({
					kind: "err",
					text: t("invalid")
				});
				return false;
			}
			if (!Number.isFinite(physics.gravity) || physics.gravity < 0 || !Number.isFinite(physics.restitution) || physics.restitution < 0 || physics.restitution > 1 || !Number.isFinite(physics.groundFriction) || physics.groundFriction < 0 || !Number.isFinite(physics.throwPower) || physics.throwPower <= 0) {
				setMsg({
					kind: "err",
					text: t("invalidPhysics")
				});
				return false;
			}
			if (!modelPairValid(whisperModel) || !modelPairValid(chatModel)) {
				setMsg({
					kind: "err",
					text: t("invalidModel")
				});
				return false;
			}
			if (!Number.isFinite(chatMemory) || chatMemory < 0) {
				setMsg({
					kind: "err",
					text: t("invalidChatMemory")
				});
				return false;
			}
			if (!Number.isFinite(chatImageLimit) || chatImageLimit < 0) {
				setMsg({
					kind: "err",
					text: t("invalidChatImageLimit")
				});
				return false;
			}
			return true;
		};
		const save = async (force = false) => {
			if (busy) return;
			const isOk = validated();
			if (!isOk) return;
			setBusy(true);
			setMsg({
				kind: "",
				text: ""
			});
			try {
				const body = {
					pets,
					notificationsEnabled: notifyEnabled$1,
					whisperImageEnabled: whisperImage,
					chatImageEnabled: chatImage,
					confineToScreen: confineScreen,
					physics,
					whisperModel,
					chatModel,
					chatMemoryRounds: chatMemory,
					chatImageLimit
				};
				const res = await fetch("/dsh-pet-7340/config" + (force === true ? "?force=1" : ""), {
					method: "PUT",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(body)
				});
				if (res.status === 409) {
					const info = await res.json().catch(() => null);
					setDialog({
						kind: "corrupt",
						path: typeof info?.userFile === "string" ? info.userFile : paths?.user ?? ""
					});
					return;
				}
				if (!res.ok) throw new Error("HTTP " + res.status);
				petBridge.reload(await res.json());
				reloadNotifications();
				setMsg({
					kind: "ok",
					text: t("saved")
				});
			} catch {
				setMsg({
					kind: "err",
					text: t("loadError")
				});
			} finally {
				setBusy(false);
			}
		};
		const sync = () => setDialog({ kind: "sync" });
		const doSync = async () => {
			setBusy(true);
			setMsg({
				kind: "",
				text: ""
			});
			try {
				const res = await fetch("/dsh-pet-7340/config", { method: "POST" });
				if (!res.ok) throw new Error("HTTP " + res.status);
				const merged = await res.json();
				applyConfig(merged);
				petBridge.reload(merged);
				reloadNotifications();
				setMsg({
					kind: "ok",
					text: t("saved")
				});
			} catch {
				setMsg({
					kind: "err",
					text: t("loadError")
				});
			} finally {
				setBusy(false);
			}
		};
		const addPet = () => {
			const tpl = petBridge.template;
			if (!tpl) return;
			const id$3 = nextId(pets);
			setPets((list) => [...list, {
				id: id$3,
				name: id$3,
				size: tpl.size,
				balanceEnabled: tpl.balanceEnabled,
				whisperEnabled: tpl.whisperEnabled,
				workStatusEnabled: tpl.workStatusEnabled,
				fixedEnabled: tpl.fixedEnabled,
				display: tpl.display,
				position: { ...tpl.position }
			}]);
			setSelId(id$3);
		};
		const removeSel = () => {
			setDialog({ kind: pets.length <= 1 ? "lastOne" : "remove" });
		};
		const doRemove = () => {
			const list = pets.filter((p) => p.id !== selId);
			setPets(list);
			setSelId(list[0].id);
		};
		/** 宠物数值输入（大小 / 水平偏移 / 垂直偏移）——宽度交给栅格，不再各自写死 */
		const numInput = (key, value, setter) => h("input", {
			type: "number",
			className: inputClass,
			step: key === "size" ? "10" : "1",
			min: key === "size" ? "120" : "",
			value: String(value),
			disabled: busy,
			onChange: (e) => setter(Number(e.target.value))
		});
		/** 物理参数的一格：标签 + 问号在上、数字输入在下（说明进问号） */
		const physField = (key, step, min, end = false) => field(t("physics." + key), h("input", {
			type: "number",
			className: inputClass,
			step,
			min,
			value: String(physics[key]),
			disabled: busy,
			onChange: (e) => setPhysics((p) => ({
				...p,
				[key]: Number(e.target.value)
			}))
		}), t("physics." + key + "Hint"), end);
		/** 「全局默认」的一个数字格：标签 + 问号在上、数字输入在下（说明 = t(label + 'Hint') 进问号） */
		const globalNumField = (label$3, value, setter) => field(t(label$3), h("input", {
			type: "number",
			className: inputClass,
			step: "1",
			min: "0",
			value: String(value),
			disabled: busy,
			onChange: (e) => setter(Number(e.target.value))
		}), t(label$3 + "Hint"));
		/** 「AI 模型」的一格：标签 + 问号在上、单下拉选择器在下 */
		const modelCell = (key, value, setter, end = false) => {
			const label$3 = t(key === "whisperModel" ? "whisperModelLabel" : "chatModelLabel");
			return field(label$3, h(ModelPicker, {
				label: label$3,
				value,
				disabled: busy,
				catalog,
				failed: catalogErr,
				onChange: setter
			}), t("modelFieldHint"), end);
		};
		return h("section", {
			className: "dsh-pet-cfg",
			style: { maxWidth: "720px" },
			children: [
				h("h2", {
					className: "dsh-pet-cfg__title",
					children: [t("nav"), q(extraCount > 0 ? t("intro") + "\n" + t("extraPetsHint").replace("{n}", String(extraCount)) : t("intro"))]
				}),
				loadState !== "ready" ? h("div", {
					role: loadState === "error" ? "alert" : "status",
					className: "dsh-pet-cfg__actions",
					children: [h("span", { children: t(loadState === "error" ? "loadError" : "loading") }), loadState === "error" ? h("button", {
						type: "button",
						className: "dsh-pet-cfg__btn",
						onClick: () => {
							setLoadState("loading");
							setLoadAttempt((attempt) => attempt + 1);
						},
						children: t("retry")
					}) : null]
				}) : null,
				h("div", {
					className: "dsh-pet-cfg__tabs",
					children: [
						h("span", {
							key: "label",
							className: "dsh-pet-cfg__tabsLabel",
							children: t("petsLabel")
						}),
						...pets.map((p) => h("button", {
							key: p.id,
							type: "button",
							onClick: () => setSelId(p.id),
							className: "dsh-pet-cfg__tab" + (p.id === selId ? " is-active" : ""),
							children: (p.name || p.id) + " (" + p.size + "px)"
						})),
						h("button", {
							key: "add",
							type: "button",
							onClick: addPet,
							disabled: busy,
							className: "dsh-pet-cfg__tab is-ghost",
							children: "+ " + t("add")
						})
					]
				}),
				cur ? h("div", {
					className: "dsh-pet-cfg__card",
					children: [
						h("div", {
							className: "dsh-pet-cfg__cardHead",
							children: [
								h("span", {
									key: "t",
									className: "dsh-pet-cfg__cardTitle",
									children: t("petCardTitle")
								}),
								q(t("petCardHint")),
								h("button", {
									key: "rm",
									type: "button",
									onClick: removeSel,
									disabled: busy,
									className: "dsh-pet-cfg__btn is-danger is-sm",
									style: { marginLeft: "auto" },
									children: t("remove")
								})
							]
						}),
						h("div", {
							className: "dsh-pet-cfg__grid3",
							children: [
								field(t("nameLabel"), h("input", {
									type: "text",
									className: inputClass,
									value: String(cur.name ?? ""),
									disabled: busy,
									maxLength: 50,
									onChange: (e) => updateSel({ name: e.target.value })
								}), t("nameHint")),
								field(t("sizeLabel"), numInput("size", cur.size, (v) => updateSel({ size: v })), t("sizeHint")),
								field(t("displayLabel"), h("select", {
									className: inputClass,
									value: cur.display,
									disabled: busy,
									onChange: (e) => updateSel({ display: e.target.value }),
									children: PET_DISPLAYS.map((d) => h("option", {
										key: d,
										value: d,
										children: t("display." + d)
									}))
								}), t("displayHint"), true)
							]
						}),
						h("div", {
							className: "dsh-pet-cfg__grid3",
							children: [
								field(t("cornerLabel"), h("select", {
									className: inputClass,
									value: cur.position.corner,
									disabled: busy,
									onChange: (e) => updateSel({ position: { corner: e.target.value } }),
									children: CORNERS.map((c) => h("option", {
										key: c,
										value: c,
										children: cornerLabel(c)
									}))
								}), t("cornerHint")),
								field(t("marginX"), numInput("marginX", cur.position.marginX, (v) => updateSel({ position: { marginX: v } })), t("marginXHint")),
								field(t("marginY"), numInput("marginY", cur.position.marginY, (v) => updateSel({ position: { marginY: v } })), t("marginYHint"), true)
							]
						}),
						h("div", {
							className: "dsh-pet-cfg__grid4",
							children: [
								toggleCell("balanceEnabled", !!cur.balanceEnabled, busy, (v) => updateSel({ balanceEnabled: v })),
								toggleCell("whisperEnabled", !!cur.whisperEnabled, busy, (v) => updateSel({ whisperEnabled: v })),
								toggleCell("workStatusEnabled", !!cur.workStatusEnabled, busy, (v) => updateSel({ workStatusEnabled: v })),
								toggleCell("fixedEnabled", !!cur.fixedEnabled, busy, (v) => updateSel({ fixedEnabled: v }), true)
							]
						})
					]
				}) : h("p", {
					className: "dsh-pet-cfg__note",
					children: t("emptyPets")
				}),
				h("div", {
					className: "dsh-pet-cfg__card",
					children: [cardHead(t("globalTitle"), t("globalHint")), h("div", {
						className: "dsh-pet-cfg__grid4",
						children: [
							toggleCell("notifyToggle", notifyEnabled$1, busy, (v) => void toggleNotify(v)),
							toggleCell("whisperImageToggle", whisperImage, busy, setWhisperImage),
							toggleCell("chatImageToggle", chatImage, busy, setChatImage),
							toggleCell("confineToggle", confineScreen, busy, setConfineScreen, true)
						]
					})]
				}),
				h("div", {
					className: "dsh-pet-cfg__card",
					children: [
						cardHead(t("modelTitle"), t("modelHint")),
						catalogErr ? h("p", {
							className: "dsh-pet-cfg__note",
							style: { color: "var(--dsw-alias-state-error-primary)" },
							children: t("modelCatalogFailed")
						}) : null,
						h("div", {
							className: "dsh-pet-cfg__grid2",
							children: [modelCell("whisperModel", whisperModel, setWhisperModel), modelCell("chatModel", chatModel, setChatModel, true)]
						}),
						h("div", {
							className: "dsh-pet-cfg__grid4",
							children: [globalNumField("chatMemory", chatMemory, setChatMemory), globalNumField("chatImageLimit", chatImageLimit, setChatImageLimit)]
						})
					]
				}),
				h("div", {
					className: "dsh-pet-cfg__card",
					children: [
						cardHead(t("physicsTitle"), t("physicsHint")),
						h("div", {
							className: "dsh-pet-cfg__grid4",
							children: [
								physField("gravity", "50", "0"),
								physField("restitution", "0.01", "0"),
								physField("groundFriction", "0.1", "0"),
								physField("throwPower", "0.05", "0.05", true)
							]
						}),
						h("div", {
							className: "dsh-pet-cfg__grid2",
							children: [toggleCell("physicsCeilingBounce", physics.ceilingBounce, busy, (v) => setPhysics((p) => ({
								...p,
								ceilingBounce: v
							}))), toggleCell("physicsPetCollision", physics.petCollision, busy, (v) => setPhysics((p) => ({
								...p,
								petCollision: v
							})), true)]
						})
					]
				}),
				h("div", {
					className: "dsh-pet-cfg__actions",
					children: [
						h("button", {
							type: "button",
							disabled: busy,
							onClick: () => void save(),
							className: "dsh-pet-cfg__btn is-primary",
							children: t("save")
						}),
						h("button", {
							type: "button",
							disabled: busy,
							onClick: sync,
							className: "dsh-pet-cfg__btn",
							children: t("sync")
						}),
						h("button", {
							type: "button",
							onClick: () => void testNotification(),
							className: "dsh-pet-cfg__btn",
							children: t("notifyTest")
						}),
						q(t("syncHint")),
						msg.text ? h("span", {
							className: "dsh-pet-cfg__msg" + (msg.kind === "err" ? " is-err" : ""),
							children: msg.text
						}) : null,
						permMsg.text ? h("span", {
							className: "dsh-pet-cfg__msg" + (permMsg.kind === "err" ? " is-err" : ""),
							children: permMsg.text
						}) : null
					]
				}),
				paths ? h("div", {
					className: "dsh-pet-cfg__card",
					children: [
						cardHead(t("configMeta"), t("configMetaHint")),
						h("div", {
							className: "dsh-pet-cfg__path",
							children: t("defaultConfig") + "：" + paths.default
						}),
						h("div", {
							className: "dsh-pet-cfg__path",
							children: t("userConfig") + "：" + paths.user
						}),
						h("div", {
							className: "dsh-pet-cfg__path",
							children: t("animationDir") + "：" + paths.animations
						}),
						paths.memes ? h("div", {
							className: "dsh-pet-cfg__path",
							children: t("memesDir") + "：" + paths.memes
						}) : null
					]
				}) : null,
				paths && paths.storage && paths.storage.length > 0 ? h("div", {
					className: "dsh-pet-cfg__card",
					children: [
						cardHead(t("storageTitle"), t("storageHint")),
						...paths.storage.map((s) => h("div", {
							key: s.key,
							className: "dsh-pet-cfg__path",
							children: [h("b", {
								key: "p",
								style: { fontFamily: MONO },
								children: s.path
							}), h("span", {
								key: "d",
								children: " — " + t("storage." + s.key) + (s.exists === false ? t("storageMissing") : "")
							})]
						})),
						h("div", {
							key: "ut",
							className: "dsh-pet-cfg__cardTitle",
							style: { marginTop: "4px" },
							children: t("uninstallTitle")
						}),
						h("div", {
							key: "u1",
							className: "dsh-pet-cfg__note",
							children: t("uninstallStep1")
						}),
						h("div", {
							key: "u2",
							className: "dsh-pet-cfg__note",
							children: t("uninstallStep2")
						}),
						h("div", {
							key: "cmd",
							className: "dsh-pet-cfg__cmd",
							children: t("uninstallCmd").replace("{profile}", paths.profile || "<profile>")
						}),
						h("div", {
							key: "u3",
							className: "dsh-pet-cfg__note",
							children: t("uninstallStep3")
						})
					]
				}) : null,
				dialog ? h("div", {
					style: {
						position: "fixed",
						inset: 0,
						zIndex: 2147483647,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						background: "rgba(0, 0, 0, 0.45)"
					},
					onClick: () => setDialog(null),
					children: h("div", {
						style: {
							width: "340px",
							maxWidth: "calc(100vw - 40px)",
							background: "var(--dsw-alias-bg-layer-1)",
							border: "1px solid var(--dsw-alias-border-l2)",
							borderRadius: "12px",
							padding: "16px 18px",
							boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
							display: "flex",
							flexDirection: "column",
							gap: "12px"
						},
						onClick: (e) => e.stopPropagation(),
						children: [
							h("div", {
								style: {
									fontSize: "14px",
									fontWeight: 500,
									color: "var(--dsw-alias-label-primary)"
								},
								children: dialog.kind === "corrupt" ? t("corruptTitle") : t("confirmTitle")
							}),
							h("div", {
								style: {
									fontSize: "13px",
									lineHeight: "20px",
									color: "var(--dsw-alias-label-secondary)"
								},
								children: dialog.kind === "remove" ? t("confirmRemove").replace("{id}", selId) : dialog.kind === "lastOne" ? t("atLeastOne") : dialog.kind === "corrupt" ? t("corruptBody").replace("{path}", dialog.path) : t("confirmSync")
							}),
							h("div", {
								style: {
									display: "flex",
									gap: "8px",
									justifyContent: "flex-end"
								},
								children: dialog.kind === "lastOne" ? [h("button", {
									key: "ok",
									type: "button",
									onClick: () => setDialog(null),
									className: "dsh-pet-cfg__btn is-primary",
									children: t("ok")
								})] : [h("button", {
									key: "cancel",
									type: "button",
									onClick: () => setDialog(null),
									className: "dsh-pet-cfg__btn",
									children: t("cancel")
								}), h("button", {
									key: "confirm",
									type: "button",
									onClick: () => {
										const d = dialog;
										setDialog(null);
										if (d.kind === "remove") doRemove();
										else if (d.kind === "corrupt") save(true);
										else doSync();
									},
									className: "dsh-pet-cfg__btn " + (dialog.kind === "sync" ? "is-primary" : "is-danger"),
									children: dialog.kind === "remove" ? t("remove") : dialog.kind === "corrupt" ? t("corruptConfirm") : t("sync")
								})]
							})
						]
					})
				}) : null
			]
		});
	};
}

//#endregion
//#region src/client/pet.ts
const statePoller = { now: () => {} };
/** 播放动画扩展名 = 共享常量（src/shared/constants.ts 的 ANIMATION_EXT，默认 .webm）。
*  macOS Safari/WKWebView 需改共享常量/产物为 .mov（HEVC-with-Alpha）后自构建。 */
const THUMB_EXT = ANIMATION_EXT;
/** 余额气泡展示时长（ms）：定时自动消失，与动画生命周期解耦 */
const BUBBLE_DURATION_MS = 10 * 1e3;
/** 内联 CSS —— 注入一次（官方插件标准做法） */
const css = [
	".dsh-pet-root{position:fixed;z-index:40;pointer-events:none;user-select:none}",
	".dsh-pet-root[data-corner=\"bottom-right\"]{right:var(--dsh-pet-mx,24px);bottom:var(--dsh-pet-my,0)}",
	".dsh-pet-root[data-corner=\"bottom-left\"]{left:var(--dsh-pet-mx,24px);bottom:var(--dsh-pet-my,0)}",
	".dsh-pet-root[data-corner=\"top-right\"]{right:var(--dsh-pet-mx,24px);top:var(--dsh-pet-my,0)}",
	".dsh-pet-root[data-corner=\"top-left\"]{left:var(--dsh-pet-mx,24px);top:var(--dsh-pet-my,0)}",
	".dsh-pet-stage{position:relative;width:var(--dsh-pet-size,462px);height:calc(var(--dsh-pet-size,462px)*9/16);pointer-events:none}",
	".dsh-pet-video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none;opacity:0;transition:opacity .18s ease;transform-origin:center}",
	".dsh-pet-video.is-front{opacity:1}",
	".dsh-pet-hit{position:absolute;pointer-events:auto;cursor:url(\"/dsh-pet-7340/pic/cursor-grab.png\") 16 16, grab;z-index:1;touch-action:none;-webkit-user-select:none;-webkit-touch-callout:none}",
	".dsh-pet-hit.dragging{cursor:url(\"/dsh-pet-7340/pic/cursor-grabbing.png\") 16 16, grabbing}",
	"@media (prefers-reduced-motion: reduce){.dsh-pet-video{transition:none}}",
	MENU_CSS,
	TOOLTIP_CSS
].join("\n");
const cssTag = "dsh-pet/style.css";
function injectCss$1() {
	if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"" + cssTag + "\"]") === null) {
		const tag = document.createElement("style");
		tag.dataset.plugin = "dsh-pet";
		tag.dataset.pluginCss = cssTag;
		tag.textContent = css;
		document.head.appendChild(tag);
	}
}
function makePetUI(rt) {
	const { h, useState, useEffect, useRef } = rt;
	injectCss$1();
	/** 余额气泡（哑组件：数据与显隐由 PetCard 传入） */
	const BalanceBubble = makeBalanceBubble({ h });
	/** 碎碎念气泡（哑组件：文本与显隐由 PetCard 传入） */
	const WhisperBubble = makeWhisperBubble({ h });
	/** 单个宠物实例（配置由容器 PetMulti 传入；碎碎念轮询/触发/气泡完全自理） */
	function PetCard({ cfg, balance, balanceTick, balanceNoticeTick, workStatus, workStatusTick, say, sayTick, animCue, animCueTick, arena }) {
		const [size, setSize] = useState(cfg.size);
		const halfW = size / 2;
		const halfH = size * 9 / 16 / 2;
		const bottomPad = size * (9 / 16) * (CANVAS_H - FEET_Y) / CANVAS_H;
		const petAnims = cfg.animations;
		const petWeights = cfg.animationWeights;
		const [character, setCharacter] = useState(cfg.character || readCharacter(window.localStorage, cfg.id));
		const [anim, setAnim] = useState(petAnims.idle[0] ?? "");
		const [once, setOnce] = useState(true);
		const [facing, setFacing] = useState("left");
		const [dragging, setDragging] = useState(false);
		const [tipOn, setTipOn] = useState(false);
		const tipRef = useRef(null);
		const [customPos, setCustomPos] = useState(null);
		const [corner, setCorner] = useState(cfg.position.corner);
		const [margin, setMargin] = useState({
			x: cfg.position.marginX,
			y: cfg.position.marginY
		});
		const [bubbleOn, setBubbleOn] = useState(false);
		const bubbleTimerRef = useRef(null);
		const [whisperBubbleOn, setWhisperBubbleOn] = useState(false);
		const whisperBubbleTimerRef = useRef(null);
		const [whisperText, setWhisperText] = useState(null);
		const [whisperImage, setWhisperImage] = useState(void 0);
		const [workBubbleOn, setWorkBubbleOn] = useState(false);
		const workBubbleTimerRef = useRef(null);
		const [workText, setWorkText] = useState(null);
		const menuRef = useRef(null);
		const chatRef = useRef(null);
		useEffect(() => {
			setSize(cfg.size);
			setCorner(cfg.position.corner);
			setMargin({
				x: cfg.position.marginX,
				y: cfg.position.marginY
			});
		}, [
			cfg.size,
			cfg.position.corner,
			cfg.position.marginX,
			cfg.position.marginY
		]);
		const [seq, setSeq] = useState(0);
		const characterRef = useRef(character);
		useEffect(() => {
			if (cfg.character && cfg.character !== characterRef.current) {
				chatRef.current?.close();
				chatRef.current = null;
				pendingRef.current = null;
				genRef.current++;
				characterRef.current = cfg.character;
				setCharacter(cfg.character);
				setSeq((s) => s + 1);
				setWhisperBubbleOn(false);
				setWhisperImage(void 0);
				setWorkBubbleOn(false);
			}
		}, [cfg.character]);
		const rootRef = useRef(null);
		const stageRef = useRef(null);
		const videoARef = useRef(null);
		const videoBRef = useRef(null);
		const imageRef = useRef(null);
		const frontRef = useRef(0);
		const pendingRef = useRef(null);
		const genRef = useRef(0);
		const dragRef = useRef({
			active: false,
			dragging: false,
			sx: 0,
			sy: 0,
			offX: 0,
			offY: 0,
			lpTimer: null
		});
		const justDraggedRef = useRef(false);
		const dragTrailRef = useRef([]);
		const boxPxRef = useRef(null);
		const dragTargetRef = useRef(null);
		const dragVelRef = useRef({
			vx: 0,
			vy: 0
		});
		const dragFollowRef = useRef(null);
		const dragFollowTokenRef = useRef(0);
		const throwRef = useRef(null);
		const throwTokenRef = useRef(0);
		const throwStateRef = useRef(null);
		const pressScoreFiredRef = useRef(false);
		const squashRef = useRef(null);
		const squashTokenRef = useRef(0);
		const pendingSquashRef = useRef(false);
		const animRef = useRef(anim);
		animRef.current = anim;
		const workStatusRef = useRef(workStatus);
		workStatusRef.current = workStatus;
		const blobUrlRef = useRef({
			a: null,
			b: null
		});
		const mountedRef = useRef(false);
		const inflightRef = useRef([]);
		const switchTo = (next, nextOnce) => {
			if (!next) return;
			const pending = pendingRef.current;
			if (pending && pending.anim === next && pending.once === nextOnce) {
				if (pendingSquashRef.current) {
					pendingSquashRef.current = false;
					const front = frontRef.current === 0 ? videoARef : videoBRef;
					if (front.current) startSquash(front.current);
				}
				return;
			}
			const gen = ++genRef.current;
			pendingRef.current = {
				anim: next,
				once: nextOnce,
				gen
			};
			const target = frontRef.current === 0 ? videoBRef : videoARef;
			const el = target.current;
			if (!el) return;
			const inEvents = isEventAnim(petAnims.events, next);
			if (inEvents) console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " switch " + next + " once=" + nextOnce);
			const media = characterMedia(character, next, cfg.assetRoot ?? cfg.id, THUMB_EXT);
			const assetUrl = "/dsh-pet-7340" + media.path;
			if (media.kind === "image" && stageRef.current) {
				imageRef.current ?? (imageRef.current = new ImagePosePlayer(stageRef.current));
				for (const video of [videoARef.current, videoBRef.current]) if (video) {
					video.onended = null;
					video.pause();
					video.classList.remove("is-front");
				}
				imageRef.current.play(assetUrl, nextOnce, handleEnded, media.cell, media.durationMs).then(() => {
					if (genRef.current === gen && imageRef.current) {
						pendingRef.current = null;
						imageRef.current.canvas.style.transform = facingRef.current === "right" ? "scaleX(-1)" : "";
						if (pendingMoveRef.current) startMoveDrive(imageRef.current);
						if (pendingSquashRef.current) {
							pendingSquashRef.current = false;
							startSquash(imageRef.current.canvas);
						}
					}
				}).catch((error) => {
					if (genRef.current === gen) {
						pendingRef.current = null;
						console.error(error.message);
					}
				});
				return;
			}
			imageRef.current?.stop();
			el.loop = !nextOnce;
			el.muted = true;
			el.autoplay = true;
			el.playsInline = true;
			el.onended = nextOnce ? handleEnded : null;
			const targetIsB = frontRef.current === 0;
			const ac = new AbortController();
			inflightRef.current.push(ac);
			const fetchTimer = window.setTimeout(() => ac.abort(), 1e4);
			fetch(assetUrl, {
				cache: "default",
				signal: ac.signal
			}).then((r) => {
				if (!r.ok) throw new Error("asset HTTP " + r.status);
				return r.blob();
			}).then((blob) => {
				window.clearTimeout(fetchTimer);
				const ix = inflightRef.current.indexOf(ac);
				if (ix !== -1) inflightRef.current.splice(ix, 1);
				if (!mountedRef.current) return;
				if (pendingRef.current?.gen !== gen) return;
				const slot = targetIsB ? "b" : "a";
				const oldUrl = blobUrlRef.current[slot];
				if (oldUrl) URL.revokeObjectURL(oldUrl);
				const obj = URL.createObjectURL(blob);
				blobUrlRef.current[slot] = obj;
				el.src = obj;
				el.load();
			}).catch((err) => {
				window.clearTimeout(fetchTimer);
				const ix = inflightRef.current.indexOf(ac);
				if (ix !== -1) inflightRef.current.splice(ix, 1);
				if (!mountedRef.current) return;
				if (pendingRef.current?.gen !== gen) return;
				pendingRef.current = null;
				console.warn("[dsh-pet] 素材加载失败 pet=" + cfg.id + " anim=" + next + "：" + (err instanceof Error ? err.message : String(err)) + "（已释放本次切换）");
			});
			const onReady = () => {
				el.removeEventListener("loadeddata", onReady);
				if (pendingRef.current?.gen !== gen) return;
				const old = frontRef.current === 0 ? videoARef : videoBRef;
				el.classList.add("is-front");
				if (old.current && old.current !== el) {
					old.current.classList.remove("is-front");
					old.current.onended = null;
					old.current.pause();
				}
				frontRef.current = frontRef.current === 0 ? 1 : 0;
				pendingRef.current = null;
				el.style.transform = facingRef.current === "right" ? "scaleX(-1)" : "";
				el.play().catch(() => {});
				if (pendingSquashRef.current) {
					pendingSquashRef.current = false;
					startSquash(el);
				}
				if (pendingMoveRef.current) startMoveDrive(el);
			};
			el.addEventListener("loadeddata", onReady);
		};
		useEffect(() => {
			switchTo(anim, once);
		}, [
			anim,
			once,
			seq,
			character
		]);
		useEffect(() => {
			mountedRef.current = true;
			const bu = blobUrlRef.current;
			const inflight = inflightRef.current;
			return () => {
				mountedRef.current = false;
				imageRef.current?.dispose();
				imageRef.current = null;
				for (const c of inflight) c.abort();
				inflight.length = 0;
				stopMove();
				stopDragFollow();
				stopThrow();
				stopSquash();
				if (bu.a) URL.revokeObjectURL(bu.a);
				if (bu.b) URL.revokeObjectURL(bu.b);
			};
		}, []);
		useEffect(() => () => {
			if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current);
			if (whisperBubbleTimerRef.current !== null) window.clearTimeout(whisperBubbleTimerRef.current);
		}, []);
		useEffect(() => () => {
			if (menuRef.current) {
				menuRef.current.close();
				menuRef.current = null;
			}
			if (chatRef.current) {
				chatRef.current.close();
				chatRef.current = null;
			}
		}, []);
		const prevTickRef = useRef(0);
		useEffect(() => {
			if (!cfg.balanceEnabled) return;
			if (balanceTick === 0 || balanceTick === prevTickRef.current) return;
			prevTickRef.current = balanceTick;
			if (!balance || !balance.ok) return;
			const p = balancePercent(balance);
			if (p === void 0) return;
			const pool = petAnims.events?.balance;
			if (!pool || pool.length === 0) {
				console.error("[dsh-pet] 配置缺少 animations.events.balance，无法播放余额事件动画");
				return;
			}
			const idx = balanceEventIndex(p);
			const slot = pool[idx];
			if (!slot) {
				console.error("[dsh-pet] balance 档位索引越界：p=" + p + " idx=" + idx);
				return;
			}
			const name$1 = pickSlot(slot, animRef.current);
			console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " balance pet=" + cfg.id + " p=" + p.toFixed(1) + "% -> [档" + idx + "] " + name$1);
			stopMove();
			setBubbleOn(true);
			if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current);
			bubbleTimerRef.current = window.setTimeout(() => setBubbleOn(false), BUBBLE_DURATION_MS);
			setOnce(true);
			setAnim(name$1);
		}, [balanceTick]);
		const prevNoticeRef = useRef(0);
		useEffect(() => {
			if (!cfg.balanceEnabled) return;
			if (balanceNoticeTick === 0 || balanceNoticeTick === prevNoticeRef.current) return;
			prevNoticeRef.current = balanceNoticeTick;
			if (!balance || balance.ok) return;
			setBubbleOn(true);
			if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current);
			bubbleTimerRef.current = window.setTimeout(() => setBubbleOn(false), BUBBLE_DURATION_MS);
		}, [balanceNoticeTick]);
		const prevWorkTickRef = useRef(0);
		const prevWorkStateRef = useRef(void 0);
		useEffect(() => {
			if (!cfg.workStatusEnabled) return;
			if (workStatusTick === 0 || workStatusTick === prevWorkTickRef.current) return;
			prevWorkTickRef.current = workStatusTick;
			if (!workStatus || workStatus.state === null) {
				console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " " + (prevWorkStateRef.current ?? "null") + "->null    播完即停（回待机，收起气泡）");
				prevWorkStateRef.current = null;
				if (poolIncludes(petAnims.events?.workStatus ?? [], animRef.current)) {
					const front = frontRef.current === 0 ? videoARef.current : videoBRef.current;
					if (front) {
						imageRef.current?.finishLoop();
						front.loop = false;
						front.onended = handleEnded;
					}
				}
				if (workBubbleTimerRef.current !== null) window.clearTimeout(workBubbleTimerRef.current);
				workBubbleTimerRef.current = null;
				setWorkText(null);
				setWorkBubbleOn(false);
				return;
			}
			const pool = petAnims.events?.workStatus;
			if (!pool || pool.length === 0) {
				console.error("[dsh-pet] 配置缺少 animations.events.workStatus，无法播放工作状态动画");
				return;
			}
			const idx = WORK_STATUS_INDEX[workStatus.state];
			const slot = pool[idx];
			if (slot === void 0) {
				console.error("[dsh-pet] work-status 档位索引越界：state=" + workStatus.state + " idx=" + idx);
				return;
			}
			const name$1 = pickSlot(slot, animRef.current);
			console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " " + (prevWorkStateRef.current ?? "null") + "->" + workStatus.state + "    " + name$1);
			const stateChanged = prevWorkStateRef.current !== workStatus.state;
			prevWorkStateRef.current = workStatus.state;
			stopMove();
			const textGroup = characterWorkTexts(character)[idx];
			const configuredText = Array.isArray(textGroup) && textGroup.length > 0 ? textGroup[Math.floor(Math.random() * textGroup.length)] : void 0;
			setWorkText(workStatus.task ?? configuredText ?? null);
			const terminal = workStatus.state === "success" || workStatus.state === "error";
			if (stateChanged) {
				setWorkBubbleOn(true);
				if (workBubbleTimerRef.current !== null) window.clearTimeout(workBubbleTimerRef.current);
				workBubbleTimerRef.current = terminal ? window.setTimeout(() => setWorkBubbleOn(false), BUBBLE_DURATION_MS) : null;
			}
			const rotating = !terminal && Array.isArray(slot) && slot.length > 1;
			setOnce(terminal || rotating);
			setAnim(name$1);
		}, [workStatusTick, character]);
		const prevSaySeqRef = useRef(0);
		useEffect(() => {
			if (!say || say.seq === prevSaySeqRef.current) return;
			prevSaySeqRef.current = say.seq;
			triggerWhisper(say.text, say.image);
		}, [sayTick]);
		const prevAnimSeqRef = useRef(0);
		useEffect(() => {
			if (!animCue || animCue.seq === prevAnimSeqRef.current) return;
			prevAnimSeqRef.current = animCue.seq;
			handleMenuAction({
				label: animCue.name,
				anim: animCue.name
			});
		}, [animCueTick]);
		const triggerWhisper = (text, image) => {
			const pool = petAnims.events?.whisper;
			if (!pool || pool.length === 0) {
				console.error("[dsh-pet] 配置缺少 animations.events.whisper，无法播放碎碎念动画");
				return;
			}
			const name$1 = pickSlot(pick(pool, animRef.current), animRef.current);
			console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " whisper pet=" + cfg.id + " -> [" + name$1 + "] 「" + text + "」");
			stopMove();
			setWhisperText(text);
			setWhisperImage(image);
			setWhisperBubbleOn(true);
			if (whisperBubbleTimerRef.current !== null) window.clearTimeout(whisperBubbleTimerRef.current);
			whisperBubbleTimerRef.current = window.setTimeout(() => setWhisperBubbleOn(false), BUBBLE_DURATION_MS);
			setOnce(true);
			setAnim(name$1);
		};
		useEffect(() => {
			const onResize = () => setCustomPos((prev) => prev ? { ...prev } : prev);
			window.addEventListener("resize", onResize);
			return () => window.removeEventListener("resize", onResize);
		}, []);
		const pickNext = () => {
			const animations = petAnims;
			const animationWeights = petWeights;
			const roll = Math.random();
			const k = rollKind(roll, animationWeights, { fixed: cfg.fixedEnabled });
			let kind;
			let next;
			if (k === "idle") {
				kind = "IDLE";
				next = pick(animations.idle, animRef.current);
				setAnim(next);
			} else if (k === "turn") {
				kind = "TURN";
				next = pick(animations.turn, animRef.current);
				setAnim(next);
			} else if (k === "move") {
				const moved = tryMove();
				if (moved === false) {
					const act = pickCategoryAction(animations.categories, animations.idle, facingRef.current, animRef.current);
					kind = act.id;
					next = act.name;
					setAnim(next);
				} else {
					kind = "MOVES";
					next = typeof moved === "string" ? moved : "移动进行中(不重播)";
				}
			} else {
				const act = pickCategoryAction(animations.categories, animations.idle, facingRef.current, animRef.current);
				kind = act.id;
				next = act.name;
				setAnim(next);
			}
			console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " facing=" + facingRef.current + " roll=" + roll.toFixed(4) + " -> [" + kind + "] " + next);
			setOnce(true);
			setSeq((s) => s + 1);
		};
		const resumeWorkStatusAnim = () => {
			const ws = workStatusRef.current;
			if (!ws || !ws.state || ws.state === "success" || ws.state === "error") return false;
			const pool = petAnims.events?.workStatus;
			if (!pool || pool.length === 0) return false;
			const idx = WORK_STATUS_INDEX[ws.state];
			const slot = pool[idx];
			if (slot === void 0) return false;
			const name$1 = pickSlot(slot, animRef.current);
			console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " 互动结束恢复状态动画: " + name$1);
			setOnce(Array.isArray(slot) && slot.length > 1);
			setAnim(name$1);
			return true;
		};
		const handleEnded = (e) => {
			const evEl = e && e.currentTarget;
			if (evEl && !evEl.classList.contains("is-front")) return;
			const animations = petAnims;
			if (dragRef.current.active) return;
			const isEvent = isEventAnim(animations.events, animRef.current);
			const wsNow = workStatusRef.current;
			if (isEvent && wsNow && wsNow.state && wsNow.state !== "success" && wsNow.state !== "error") {
				const nextWork = nextWorkStatusAnim(animations.events?.workStatus ?? [], animRef.current);
				if (nextWork !== null) {
					console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " workStatus 档内轮换: " + animRef.current + " -> " + nextWork);
					setOnce(true);
					setAnim(nextWork);
					setSeq((s) => s + 1);
					return;
				}
				if (poolIncludes(animations.events?.workStatus ?? [], animRef.current)) {
					console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " workStatus 循环续播: " + animRef.current);
					setOnce(false);
					setSeq((s) => s + 1);
					return;
				}
			}
			if (isEvent) {
				console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " 事件动画播完 ended anim=" + animRef.current + " ws=" + (workStatusRef.current && workStatusRef.current.state || "null"));
				if (resumeWorkStatusAnim()) return;
				if (animations.idle.length) setAnim(pick(animations.idle, animRef.current));
				setOnce(true);
				setSeq((s) => s + 1);
				return;
			}
			if (animations.turn.includes(animRef.current)) {
				const next = facing === "left" ? "right" : "left";
				setFacing(next);
				facingRef.current = next;
			}
			if (animations.drag.includes(animRef.current) || animations.clicks.includes(animRef.current)) {
				if (resumeWorkStatusAnim()) return;
				if (animations.idle.length) setAnim(pick(animations.idle, animRef.current));
				setOnce(true);
				setSeq((s) => s + 1);
				return;
			}
			pickNext();
		};
		const moveRef = useRef(null);
		const moveTokenRef = useRef(0);
		const pendingMoveRef = useRef(null);
		const customPosRef = useRef(customPos);
		customPosRef.current = customPos;
		const currentCenterX = () => {
			const cp = customPosRef.current;
			if (cp) return cp.rx * window.innerWidth;
			const rootEl = rootRef.current;
			if (rootEl) return rootEl.getBoundingClientRect().left + halfW;
			return window.innerWidth - 24 - halfW;
		};
		const currentCenterY = () => {
			const cp = customPosRef.current;
			if (cp) return cp.ry * window.innerHeight;
			const rootEl = rootRef.current;
			if (rootEl) return rootEl.getBoundingClientRect().top + halfH;
			return window.innerHeight - 20 - halfH;
		};
		const startMoveDrive = (el) => {
			const pm = pendingMoveRef.current;
			if (!pm || moveRef.current !== null) return;
			pendingMoveRef.current = null;
			const { startRatio, startYRatio, targetRatio, dir, totalRatio, leadSec, tailSec } = pm;
			const duration = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 10.09;
			const travelWindow = Math.max(.1, duration - leadSec - tailSec);
			const token = ++moveTokenRef.current;
			const step = () => {
				if (moveTokenRef.current !== token) return;
				const t = el.currentTime || 0;
				const rootEl = rootRef.current;
				if (rootEl) {
					const W = window.innerWidth;
					const H = window.innerHeight;
					let ratioX;
					if (t <= leadSec) ratioX = startRatio;
					else if (t >= duration - tailSec) ratioX = targetRatio;
					else ratioX = startRatio + dir * totalRatio * ((t - leadSec) / travelWindow);
					const px = ratioX * W;
					const py = startYRatio * H;
					rootEl.style.left = px - halfW + "px";
					rootEl.style.top = py - halfH + "px";
					rootEl.style.right = "auto";
					rootEl.style.bottom = "auto";
				}
				if (t < duration - tailSec) moveRef.current = requestAnimationFrame(step);
				else {
					moveRef.current = null;
					setCustomPos({
						rx: targetRatio,
						ry: startYRatio
					});
				}
			};
			moveRef.current = requestAnimationFrame(step);
		};
		/** 尝试发起一次移动：占用中返回 true（不重播），无法移动返回 false，成功返回动作名（供日志显示具体动作）。
		*  preferredName 传入时固定使用该动画（右键菜单点播移动动画），否则与随机链一致随机从 moves.actions 选。 */
		const tryMove = (preferredName) => {
			if (moveRef.current !== null || pendingMoveRef.current || throwRef.current !== null) return true;
			const moves = petAnims.moves;
			const actions$3 = moves.actions;
			if (!actions$3.length) return false;
			const chosen = preferredName ? actions$3.find((a) => a.name === preferredName) ?? null : actions$3[Math.floor(Math.random() * actions$3.length)];
			if (!chosen) return false;
			const mp = Object.assign({}, moves.default, chosen.params || {});
			const dir = facingRef.current === "right" !== petAnims.turn.includes(animRef.current) ? 1 : -1;
			const W = window.innerWidth;
			const distScale = size / PET_REF_WIDTH;
			const plan = planMove({
				cx: currentCenterX(),
				cy: currentCenterY(),
				W,
				H: window.innerHeight,
				dir,
				minDist: mp.minDist * distScale,
				maxDist: mp.maxDist * distScale,
				margin: mp.margin,
				halfW,
				sideAllow
			});
			if (!plan) return false;
			pendingMoveRef.current = {
				...plan,
				dir,
				leadSec: mp.leadSec,
				tailSec: mp.tailSec
			};
			setOnce(true);
			setAnim(chosen.name);
			return chosen.name;
		};
		const stopMove = () => {
			pendingMoveRef.current = null;
			moveTokenRef.current++;
			if (moveRef.current !== null) {
				cancelAnimationFrame(moveRef.current);
				moveRef.current = null;
			}
		};
		/** 停止弹簧跟随（不碰 dragState：指针捕获期间由 pointerdown/up 独立管理） */
		const stopDragFollow = () => {
			dragFollowTokenRef.current++;
			if (dragFollowRef.current !== null) {
				cancelAnimationFrame(dragFollowRef.current);
				dragFollowRef.current = null;
			}
			dragTargetRef.current = null;
			dragVelRef.current = {
				vx: 0,
				vy: 0
			};
		};
		/** 停止抛掷（宠物在空中被抓住/点菜单/回家时立即定格在当前落点）。
		*  同时清速度状态 throwStateRef——否则「抓住后温柔放下」会残留最后一次飞行速度，
		*  静止的宠物点一下就误判为飞行中。点击积分用的飞行动态由 pointerdown 提前记录。 */
		const stopThrow = () => {
			throwTokenRef.current++;
			if (throwRef.current !== null) {
				cancelAnimationFrame(throwRef.current);
				throwRef.current = null;
			}
			throwStateRef.current = null;
		};
		/** rAF 弹簧跟随：包围盒朝拖拽目标（指针-抓取偏移）过阻尼追赶，抹平高频抖动 */
		const startDragFollow = (rootEl) => {
			if (dragFollowRef.current !== null) return;
			const token = ++dragFollowTokenRef.current;
			let last = performance.now();
			const step = () => {
				if (dragFollowTokenRef.current !== token) return;
				const target = dragTargetRef.current;
				if (!target) {
					dragFollowRef.current = null;
					return;
				}
				const now = performance.now();
				const dt = Math.min((now - last) / 1e3, 1 / 30);
				last = now;
				const vel = dragVelRef.current;
				let x = boxPxRef.current?.x ?? 0;
				let y = boxPxRef.current?.y ?? 0;
				vel.vx = springStep(vel.vx, x, target.x, dt, cfg.physics.throwPower);
				vel.vy = springStep(vel.vy, y, target.y, dt, cfg.physics.throwPower);
				x += vel.vx * dt;
				y += vel.vy * dt;
				boxPxRef.current = {
					x,
					y
				};
				rootEl.style.left = x + "px";
				rootEl.style.top = y + "px";
				rootEl.style.right = "auto";
				rootEl.style.bottom = "auto";
				dragFollowRef.current = requestAnimationFrame(step);
			};
			dragFollowRef.current = requestAnimationFrame(step);
		};
		/** 抛掷驱动：重力 + 边缘反弹 + 落地摩擦，落定后提交 customPos（飞行中只改 DOM，避免逐帧 React 重渲染） */
		const startThrow = (px, py, vx, vy) => {
			stopDragFollow();
			stopMove();
			const bounds = throwBounds({
				W: window.innerWidth,
				H: window.innerHeight,
				size,
				sideAllow
			});
			const token = ++throwTokenRef.current;
			let state = {
				x: px,
				y: py,
				vx,
				vy
			};
			let last = performance.now();
			let prevGrounded = false;
			const rootEl = rootRef.current;
			const step = () => {
				if (throwTokenRef.current !== token) return;
				const now = performance.now();
				const dt = (now - last) / 1e3;
				last = now;
				const fallingVy = state.vy;
				const res = throwStep(state, dt, bounds, cfg.physics);
				state = {
					x: res.x,
					y: res.y,
					vx: res.vx,
					vy: res.vy
				};
				throwStateRef.current = state;
				if (cfg.physics.petCollision) {
					const myBody = bodyPixelBox({
						x: state.x,
						y: state.y,
						size,
						bottomPad
					});
					for (const slotId of Object.keys(arena.current.slots)) {
						if (slotId === cfg.id) continue;
						const slot = arena.current.slots[slotId];
						const otherBox = slot.getBox();
						if (!otherBox) continue;
						const otherBody = bodyPixelBox({
							x: otherBox.x,
							y: otherBox.y,
							size: slot.size,
							bottomPad: slot.bottomPad
						});
						if (!rectsOverlap(myBody, otherBody)) continue;
						const vel = slot.getVel();
						const hit = collidePet({
							x: state.x,
							y: state.y,
							vx: state.vx,
							vy: state.vy,
							size
						}, {
							x: otherBox.x,
							y: otherBox.y,
							vx: vel.vx,
							vy: vel.vy,
							size: slot.size
						});
						if (hit) {
							state.vx = hit.fvx;
							state.vy = hit.fvy;
							throwStateRef.current = state;
							slot.onHit(hit.hvx, hit.hvy);
							break;
						}
					}
				}
				if (rootEl) {
					rootEl.style.left = res.x + "px";
					rootEl.style.top = res.y + "px";
					rootEl.style.right = "auto";
					rootEl.style.bottom = "auto";
				}
				boxPxRef.current = {
					x: res.x,
					y: res.y
				};
				customPosRef.current = {
					rx: (res.x + halfW) / window.innerWidth,
					ry: (res.y + halfH) / window.innerHeight
				};
				const grounded = res.y >= bounds.maxY - 1;
				if (res.bounced && grounded && !prevGrounded) {
					const frontEl = frontRef.current === 0 ? videoARef.current : videoBRef.current;
					if (frontEl) startSquash(frontEl, landingSquash(fallingVy));
				}
				prevGrounded = grounded;
				if (res.atRest) {
					throwRef.current = null;
					throwStateRef.current = null;
					setCustomPos(customPosRef.current);
					return;
				}
				throwRef.current = requestAnimationFrame(step);
			};
			throwRef.current = requestAnimationFrame(step);
		};
		/** 被撞回调（宠物间碰撞）：被其它飞行中宠物撞到 → 停当前动作，从落点以新初速抛出去（全复用现有物理） */
		const startThrowLatestRef = useRef(() => {});
		startThrowLatestRef.current = startThrow;
		const onPetHit = (vx, vy) => {
			stopMove();
			stopDragFollow();
			stopThrow();
			const bx = boxPxRef.current;
			let sx = 0;
			let sy = 0;
			if (bx) {
				sx = bx.x;
				sy = bx.y;
			} else {
				const r = rootRef.current?.getBoundingClientRect();
				if (r) {
					sx = r.left;
					sy = r.top;
				}
			}
			startThrowLatestRef.current(sx, sy, vx, vy);
		};
		useEffect(() => {
			const arenaSlots = arena.current.slots;
			arenaSlots[cfg.id] = {
				size,
				bottomPad,
				getBox: () => {
					if (boxPxRef.current) return boxPxRef.current;
					const r = rootRef.current?.getBoundingClientRect();
					return r ? {
						x: r.left,
						y: r.top
					} : null;
				},
				getVel: () => throwRef.current !== null && throwStateRef.current ? {
					vx: throwStateRef.current.vx,
					vy: throwStateRef.current.vy
				} : {
					vx: 0,
					vy: 0
				},
				onHit: onPetHit
			};
			return () => {
				delete arenaSlots[cfg.id];
			};
		}, [
			cfg.id,
			size,
			bottomPad,
			arena
		]);
		/** Q 弹挤压：前台视频垂直压扁（贴地锚定，transform-origin:bottom）再回弹；
		*  与桌面同构，曲线在 shared（squashScale）。depth = 下压幅度（点击固定 0.55；
		*  落地按冲击速度 landingSquash 动态取）。reduce-motion 时跳过。 */
		const startSquash = (el, depth = SQ_SQUASH) => {
			if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
			const token = ++squashTokenRef.current;
			if (squashRef.current !== null) cancelAnimationFrame(squashRef.current);
			const origin = el.style.transformOrigin;
			el.style.transformOrigin = "bottom";
			const t0 = performance.now();
			const step = () => {
				if (squashTokenRef.current !== token) return;
				const u = Math.min((performance.now() - t0) / SQ_DURATION_MS, 1);
				const scale = squashScale(u, depth);
				el.style.transform = (facingRef.current === "right" ? "scaleX(-1) " : "") + "scaleY(" + scale + ")";
				if (u < 1) squashRef.current = requestAnimationFrame(step);
				else {
					squashRef.current = null;
					el.style.transformOrigin = origin;
					el.style.transform = facingRef.current === "right" ? "scaleX(-1)" : "";
				}
			};
			squashRef.current = requestAnimationFrame(step);
		};
		const stopSquash = () => {
			squashTokenRef.current++;
			if (squashRef.current !== null) {
				cancelAnimationFrame(squashRef.current);
				squashRef.current = null;
			}
		};
		const facingRef = useRef(facing);
		facingRef.current = facing;
		/** 把提示框摆到光标右下（右边/下边装不下自动翻边并夹回视口内）。
		*  直接写 DOM style 而不走 React 状态：鼠标每动一下都更新状态会让整个 PetCard 重渲染，
		*  代价远大于这一次样式写入（root 的位置也是这么直接写的）。
		*  bounds 用视口——提示是 position:fixed，坐标就是 clientX/clientY 这一套。 */
		const placeTip = (clientX, clientY) => {
			const tipEl = tipRef.current;
			if (!tipEl) return;
			const viewport = document.documentElement;
			const p = tooltipPlacement({
				x: clientX,
				y: clientY
			}, {
				w: tipEl.offsetWidth,
				h: tipEl.offsetHeight
			}, {
				x: 0,
				y: 0,
				w: viewport.clientWidth,
				h: viewport.clientHeight
			}, size * TOOLTIP_GAP_RATIO);
			tipEl.style.left = p.x + "px";
			tipEl.style.top = p.y + "px";
		};
		const handlePointerDown = (e) => {
			if (e.button !== 0) return;
			const grabState = throwStateRef.current;
			console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " grab vx=" + (grabState ? Math.round(grabState.vx) : 0) + " vy=" + (grabState ? Math.round(grabState.vy) : 0) + " |v|=" + (grabState ? Math.round(Math.hypot(grabState.vx, grabState.vy)) : 0));
			pressScoreFiredRef.current = false;
			if (grabState) {
				const grabSpeed = Math.hypot(grabState.vx, grabState.vy);
				if (grabSpeed >= SCORE_MIN_SPEED) {
					const sc = clickScore(grabSpeed, size);
					pressScoreFiredRef.current = true;
					console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " click-score speed=" + Math.round(grabSpeed) + " size=" + size + " -> +" + sc);
					spawnScoreBurst(e.clientX, e.clientY);
					mountScorePopup({
						x: e.clientX,
						y: e.clientY,
						score: sc,
						speed: grabSpeed,
						size
					});
				}
			}
			stopThrow();
			stopDragFollow();
			stopMove();
			dragTrailRef.current = [];
			e.currentTarget.classList.add("dragging");
			e.currentTarget.setPointerCapture(e.pointerId);
			setTipOn(false);
			const rootEl = rootRef.current;
			let offX = 0;
			let offY = 0;
			if (rootEl) {
				const rr = rootEl.getBoundingClientRect();
				offX = e.clientX - (rr.left + rr.width / 2);
				offY = e.clientY - (rr.top + rr.height / 2);
				boxPxRef.current = {
					x: rr.left,
					y: rr.top
				};
			}
			dragRef.current = {
				active: true,
				dragging: false,
				sx: e.clientX,
				sy: e.clientY,
				offX,
				offY,
				lpTimer: null
			};
			if (e.pointerType !== "mouse" && e.pointerType !== "pen") {
				const lpEl = e.currentTarget;
				const lpId = e.pointerId;
				const lpX = e.clientX;
				const lpY = e.clientY;
				dragRef.current.lpTimer = setTimeout(() => {
					dragRef.current.lpTimer = null;
					const dl = dragRef.current;
					if (!dl.active || dl.dragging) return;
					dl.active = false;
					pressScoreFiredRef.current = true;
					if (lpEl.hasPointerCapture(lpId)) lpEl.releasePointerCapture(lpId);
					console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " -> [TOUCH-MENU]");
					lpEl.dispatchEvent(new MouseEvent("contextmenu", {
						bubbles: true,
						cancelable: true,
						view: window,
						clientX: lpX,
						clientY: lpY,
						button: 2
					}));
				}, 500);
			}
		};
		const handlePointerMove = (e) => {
			if (tipOn) placeTip(e.clientX, e.clientY);
			const d = dragRef.current;
			if (!d.active) return;
			const dx = e.clientX - d.sx;
			const dy = e.clientY - d.sy;
			if (d.lpTimer && Math.hypot(dx, dy) > 8) {
				clearTimeout(d.lpTimer);
				d.lpTimer = null;
			}
			if (!d.dragging) {
				if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
				d.dragging = true;
				setDragging(true);
				setOnce(true);
				if (petAnims.drag.length) {
					const name$1 = pick(petAnims.drag);
					console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " -> [DRAG] " + name$1);
					setAnim(name$1);
				}
			}
			const now = performance.now();
			dragTrailRef.current = trimTrail([...dragTrailRef.current, {
				t: now,
				x: e.clientX,
				y: e.clientY
			}], now);
			dragTargetRef.current = {
				x: e.clientX - d.offX - halfW,
				y: e.clientY - d.offY - halfH
			};
			const rootEl = rootRef.current;
			if (rootEl) startDragFollow(rootEl);
			const stageEl = stageRef.current;
			if (stageEl) stageEl.style.transform = "none";
		};
		const handlePointerUp = (e) => {
			const d = dragRef.current;
			if (d.lpTimer) {
				clearTimeout(d.lpTimer);
				d.lpTimer = null;
			}
			const wasDragging = d.dragging;
			d.active = false;
			d.dragging = false;
			e.currentTarget.classList.remove("dragging");
			stopDragFollow();
			if (wasDragging) {
				justDraggedRef.current = true;
				setTimeout(() => {
					justDraggedRef.current = false;
				}, 100);
				setDragging(false);
				const stageEl = stageRef.current;
				if (stageEl) stageEl.style.transform = "translateY(" + bottomPad + "px)";
				if (!resumeWorkStatusAnim()) {
					if (petAnims.idle.length) setAnim(pick(petAnims.idle, animRef.current));
					setOnce(true);
				}
				const bx = boxPxRef.current;
				const px = bx ? bx.x : e.clientX - d.offX - halfW;
				const py = bx ? bx.y : e.clientY - d.offY - halfH;
				const vel = estimateReleaseVelocity(dragTrailRef.current, performance.now(), cfg.physics);
				dragTrailRef.current = [];
				if (vel) {
					console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " release vx=" + Math.round(vel.vx) + " vy=" + Math.round(vel.vy) + " |v|=" + Math.round(Math.hypot(vel.vx, vel.vy)));
					startThrow(px, py, vel.vx, vel.vy);
				} else setCustomPos({
					rx: (px + halfW) / window.innerWidth,
					ry: (py + halfH) / window.innerHeight
				});
			}
			const hitRect = e.currentTarget.getBoundingClientRect();
			if (e.clientX >= hitRect.left && e.clientX <= hitRect.right && e.clientY >= hitRect.top && e.clientY <= hitRect.bottom) {
				placeTip(e.clientX, e.clientY);
				setTipOn(true);
			}
		};
		const handleClick = () => {
			const d = dragRef.current;
			if (d.active || d.dragging || justDraggedRef.current) return;
			if (pressScoreFiredRef.current) {
				pressScoreFiredRef.current = false;
				stopThrow();
				stopMove();
				return;
			}
			stopThrow();
			stopMove();
			setOnce(true);
			if (!petAnims.clicks.length) return;
			const name$1 = pick(petAnims.clicks);
			console.log("[dsh-pet] " + new Date().toTimeString().slice(0, 8) + " pet=" + cfg.id + " -> [CLICK] " + name$1);
			pendingSquashRef.current = true;
			setSeq((s) => s + 1);
			setAnim(name$1);
		};
		const handleMenuAction = (leaf$1) => {
			if (isSizeAction(leaf$1.action)) {
				resizePet("/dsh-pet-7340", cfg.id, leaf$1.action).then(() => statePoller.now()).catch((error) => console.error(error.message));
				return;
			}
			const selected = characterAction(leaf$1.action);
			if (selected) {
				saveCharacter("/dsh-pet-7340", cfg.id, selected).then(() => {
					chatRef.current?.close();
					chatRef.current = null;
					pendingRef.current = null;
					genRef.current++;
					characterRef.current = selected;
					setCharacter(selected);
					setSeq((s) => s + 1);
					setWhisperBubbleOn(false);
					setWhisperImage(void 0);
					setWorkBubbleOn(false);
					statePoller.now();
				}).catch((error) => console.error(error.message));
				return;
			}
			if (leaf$1.action === "whisper") {
				console.info("[dsh-pet] 菜单触发碎碎念 pet=" + cfg.id);
				postAction("/dsh-pet-7340/whisper?pet=" + encodeURIComponent(cfg.id)).then((ok) => {
					if (!ok) console.warn("[dsh-pet] 碎碎念手动触发失败 pet=" + cfg.id);
					statePoller.now();
				}).catch((e) => console.warn("[dsh-pet] 碎碎念手动触发异常", e));
				return;
			}
			if (leaf$1.action === "chat") {
				if (chatRef.current) chatRef.current.close();
				const hitRect = stageRef.current?.querySelector(".dsh-pet-hit")?.getBoundingClientRect();
				chatRef.current = mountChatDialog({
					petId: cfg.id,
					petName: characterLabel(character),
					baseUrl: "/dsh-pet-7340/chat",
					x: hitRect ? hitRect.right + 6 : window.innerWidth - 256,
					y: hitRect ? hitRect.top + 6 : 8,
					onSent: () => {
						console.info("[dsh-pet] 对话已发送 pet=" + cfg.id);
						statePoller.now();
					},
					onClose: () => {
						chatRef.current = null;
					}
				});
				return;
			}
			if (leaf$1.action === "home") {
				stopThrow();
				stopMove();
				setCustomPos(null);
				return;
			}
			if (!leaf$1.anim) return;
			if (isNoMirrorAnimation(petAnims.categories, leaf$1.anim) && facingRef.current === "right") setFacing("left");
			if (petAnims.moves.actions.some((a) => a.name === leaf$1.anim)) {
				if (tryMove(leaf$1.anim) === false) {
					stopMove();
					setOnce(true);
					setAnim(leaf$1.anim);
				}
				return;
			}
			stopMove();
			setOnce(true);
			setAnim(leaf$1.anim);
		};
		const handleContextMenu = (e) => {
			const tree = [
				characterMenu(character),
				sizeMenu(cfg.sizePercent),
				{
					label: "碎碎念",
					action: "whisper"
				},
				{
					label: "对话",
					action: "chat"
				},
				{
					label: "回到初始位置",
					action: "home"
				},
				...characterActionMenu(character, petAnims)
			];
			if (!tree.length) return;
			e.preventDefault();
			e.stopPropagation();
			const d = dragRef.current;
			if (d.active || d.dragging || justDraggedRef.current) return;
			stopThrow();
			stopMove();
			if (menuRef.current) menuRef.current.close();
			menuRef.current = mountContextMenu({
				tree,
				x: e.clientX,
				y: e.clientY,
				onAction: handleMenuAction,
				onClose: () => {
					if (menuRef.current) menuRef.current = null;
				}
			});
		};
		const sideAllow = HIT_BOX.x0 / 640 * size;
		const stageStyle = dragging ? { transform: "none" } : { transform: "translateY(" + bottomPad + "px)" };
		const rootStyle = customPos ? (() => {
			const rx = customPos.rx;
			const ry = customPos.ry;
			return {
				left: rx * window.innerWidth - halfW + "px",
				top: ry * window.innerHeight - halfH + "px",
				right: "auto",
				bottom: "auto"
			};
		})() : {};
		const workTerminal = workStatus?.state === "success" || workStatus?.state === "error";
		const bubbleNode = (() => {
			if (workTerminal && workBubbleOn && workText && cfg.workStatusEnabled) return h(WhisperBubble, {
				text: workText,
				on: workBubbleOn
			});
			if (whisperBubbleOn && whisperText) return h(WhisperBubble, {
				text: whisperText,
				image: characterMemeName(character, whisperImage || ""),
				assetRoot: characterMemeRoot(character, cfg.assetRoot),
				on: whisperBubbleOn
			});
			if (bubbleOn && balance && cfg.balanceEnabled) return h(BalanceBubble, {
				state: balance,
				on: bubbleOn
			});
			if (workBubbleOn && workText && cfg.workStatusEnabled) return h(WhisperBubble, {
				text: workText,
				on: workBubbleOn
			});
			return null;
		})();
		const commonVideoProps = {
			muted: true,
			playsInline: true,
			autoPlay: true
		};
		const hitProps = {
			className: "dsh-pet-hit",
			style: {
				left: HIT_BOX.x0 / 640 * 100 + "%",
				top: HIT_BOX.y0 / 360 * 100 + "%",
				width: (HIT_BOX.x1 - HIT_BOX.x0) / 640 * 100 + "%",
				height: (HIT_BOX.y1 - HIT_BOX.y0) / 360 * 100 + "%"
			},
			onClick: handleClick,
			onPointerDown: handlePointerDown,
			onPointerMove: handlePointerMove,
			onPointerUp: handlePointerUp,
			onPointerCancel: handlePointerUp,
			onPointerEnter: (e) => {
				placeTip(e.clientX, e.clientY);
				setTipOn(true);
			},
			onPointerLeave: () => setTipOn(false),
			onContextMenu: handleContextMenu,
			"aria-label": characterLabel(character)
		};
		return h("div", {
			ref: rootRef,
			className: "dsh-pet-root",
			"data-corner": corner,
			"data-facing": facing,
			style: Object.assign({
				"--dsh-pet-size": size + "px",
				"--dsh-pet-mx": margin.x + "px",
				"--dsh-pet-my": margin.y + "px"
			}, rootStyle),
			children: [
				bubbleNode,
				h("div", {
					ref: stageRef,
					className: "dsh-pet-stage",
					style: stageStyle,
					children: [
						h("video", Object.assign({}, commonVideoProps, {
							ref: videoARef,
							className: "dsh-pet-video is-front"
						})),
						h("video", Object.assign({}, commonVideoProps, {
							ref: videoBRef,
							className: "dsh-pet-video"
						})),
						h("div", hitProps)
					]
				}),
				h("div", {
					ref: tipRef,
					className: TOOLTIP_CLASS + (tipOn ? " is-on" : ""),
					"aria-hidden": "true",
					children: characterLabel(character)
				})
			]
		});
	}
	/** 多开容器：一次拉取成品配置 → 拍平 → 渲染多个 PetCard */
	function PetMulti() {
		const [pets, setPets] = useState([]);
		const [ready, setReady] = useState(false);
		const arenaRef = useRef({ slots: {} });
		const [balance, setBalance] = useState(null);
		const [balanceTick, setBalanceTick] = useState(0);
		const [balanceNoticeTick, setBalanceNoticeTick] = useState(0);
		const noticeKeyRef = useRef(null);
		const applyBalanceRef = useRef(() => {});
		applyBalanceRef.current = (state, explicit) => {
			setBalance(state);
			if (state.ok) {
				setBalanceTick((t) => t + 1);
				return;
			}
			const { show, key } = decideBalanceNotice(state, noticeKeyRef.current, explicit);
			noticeKeyRef.current = key;
			if (show) setBalanceNoticeTick((t) => t + 1);
			if (state.reason !== "unsupported") console.error("[dsh-pet] 余额查询失败 reason=" + state.reason + (state.message ? " " + state.message : ""));
		};
		const [workStatus, setWorkStatus] = useState(null);
		const [workStatusTick, setWorkStatusTick] = useState(0);
		useEffect(() => {
			let alive = true;
			/** 唯一填充点：host 成品聚合 → 渲染列表。初始加载与设置页保存/同步后重载都走这里——
			*  条目级字段（动画池/权重/刷新周期/物理参数/工作状态文案）只由 flattenConfigPets 吹入，
			*  容器不再自己拼任何字段（曾经的第二份补吹实现漏过 physics，导致新增/同步后拖不动）。 */
			const applyMerged = (merged) => {
				const main$1 = merged?.main;
				if (typeof main$1 !== "object" || main$1 === null) throw new Error("配置响应不是成品聚合（host 版本不匹配？）");
				const flattened = flattenConfigPets(merged);
				petBridge.current = flattened;
				petBridge.template = Array.isArray(main$1.pets) ? main$1.pets[0] ?? void 0 : void 0;
				setPets(flattened);
			};
			/** 拉成品聚合：host readAllConfig 的输出（字段填满、绝对正确），客户端零校验零兜底 */
			const loadMerged = async () => {
				const r = await fetch("/dsh-pet-7340/config");
				if (!r.ok) throw new Error("config HTTP " + r.status);
				return await r.json();
			};
			(async () => {
				try {
					const merged = await loadMerged();
					if (!alive) return;
					applyMerged(merged);
					setReady(true);
				} catch (e) {
					console.error("[dsh-pet] 配置加载失败", e);
				}
			})();
			petBridge.reload = (merged) => {
				(async () => {
					try {
						const next = merged ?? await loadMerged();
						if (!alive) return;
						applyMerged(next);
					} catch (e) {
						console.error("[dsh-pet] 配置重载失败，保留当前渲染列表", e);
					}
				})();
			};
			return () => {
				alive = false;
				petBridge.reload = () => {};
			};
		}, []);
		const visiblePets = pets.filter((p) => isWebVisible(p.display));
		const [sayTick, setSayTick] = useState(0);
		const sayRef = useRef({});
		const [animCueTick, setAnimCueTick] = useState(0);
		const animCueRef = useRef({});
		useEffect(() => {
			if (!ready) return;
			let alive = true;
			let baseline = null;
			const poll = async () => {
				try {
					const s = await fetchState();
					if (!alive || !s) return;
					setPets((current) => {
						let changed = false;
						const next = current.map((p) => {
							const resized = s.pets[p.id]?.size?.data;
							if (resized?.size && resized.size !== p.size) {
								changed = true;
								p = {
									...p,
									size: resized.size,
									sizePercent: resized.sizePercent
								};
							}
							const id$3 = s.pets[p.id]?.character?.data;
							if (id$3?.id && id$3.id !== p.character) {
								changed = true;
								return {
									...p,
									character: id$3.id,
									name: characterLabel(id$3.id)
								};
							}
							return p;
						});
						return changed ? next : current;
					});
					if (baseline === null) {
						baseline = flattenCounters(s);
						return;
					}
					for (const { path, leaf: leaf$1 } of takeChanged(s, baseline)) {
						if (leaf$1.data === null) continue;
						if (path === "sections.balance") {
							const hit = readBalance(leaf$1);
							if (hit) applyBalanceRef.current(hit.state, hit.manual);
						} else if (path === "sections.workStatus") {
							const snap = readWorkStatus(leaf$1);
							if (snap) {
								setWorkStatus(snap);
								setWorkStatusTick((t) => t + 1);
							}
						} else if (path === "sections.notify") notifyFromFrame(leaf$1.data);
						else if (path.startsWith("pets.") && path.endsWith(".say")) {
							const petId = path.slice(5, -4);
							const said = readSay(leaf$1);
							if (said) {
								sayRef.current[petId] = {
									...said,
									seq: (sayRef.current[petId]?.seq ?? 0) + 1
								};
								setSayTick((t) => t + 1);
							}
						} else if (path.startsWith("pets.") && path.endsWith(".anim")) {
							const petId = path.slice(5, -5);
							const hit = readAnim(leaf$1);
							if (hit) {
								animCueRef.current[petId] = {
									name: hit.name,
									seq: (animCueRef.current[petId]?.seq ?? 0) + 1
								};
								setAnimCueTick((t) => t + 1);
							}
						}
					}
				} catch {}
			};
			statePoller.now = () => void poll();
			poll();
			const timer = window.setInterval(() => void poll(), 1e3);
			return () => {
				alive = false;
				statePoller.now = () => {};
				window.clearInterval(timer);
			};
		}, [ready]);
		return ready ? visiblePets.map((p) => h(PetCard, {
			key: p.id,
			cfg: p,
			balance,
			balanceTick,
			balanceNoticeTick,
			workStatus,
			workStatusTick,
			say: sayRef.current[p.id],
			sayTick,
			animCue: animCueRef.current[p.id],
			animCueTick,
			arena: arenaRef
		})) : null;
	}
	return PetMulti;
}

//#endregion
//#region src/client/command-faces.ts
function installCommandFaces(commandUi, faces) {
	const original = commandUi.candidates;
	if (typeof original !== "function") {
		console.warn("[dsh-pet] 命令图标不可用：commandUi.candidates 缺失（命令本身仍可用，只是没有图标）");
		return () => {};
	}
	const patched = async (session, req) => {
		const rows = await original.call(commandUi, session, req);
		try {
			if (!Array.isArray(rows)) return rows;
			return rows.map((raw) => {
				if (raw === null || typeof raw !== "object") return raw;
				const row = raw;
				const face = faces.get(typeof row.name === "string" ? row.name : "");
				if (face === void 0 || row.icon !== void 0) return row;
				return {
					...row,
					label: face.label(),
					icon: face.icon
				};
			});
		} catch (error) {
			console.warn("[dsh-pet] 命令图标补丁异常，本次退回原始菜单行：" + (error instanceof Error ? error.message : String(error)));
			return rows;
		}
	};
	commandUi.candidates = patched;
	return () => {
		if (commandUi.candidates === patched) commandUi.candidates = original;
	};
}

//#endregion
//#region src/client/nav-icon.ts
/**
* 设置面板导航图标补丁 —— 把「桌宠配置」那一行的兜底齿轮换成指定图标。
*
* ## 为什么需要它
*
* DSH 设置面板的导航图标是**按分区 id 硬编码的白名单 + 兜底齿轮**，没有任何给第三方
* 分区配图标的入口：
*
*   · `dsh-client-ui-settings-general/lib/client.js` 的 `navIcon(id)`（:243-269）只认
*     account / models / agent-presets / plugins / archived-sessions 五个 id，其余
*     一律 `IconSettingsOutlineMedium` —— 源码注释原文就是 "unknown ids fall back
*     to the settings gear"；
*   · 导航行数据是 `ctx.slots.entries("settings.section")` 投影出来的
*     `{ id, order, label }`（同文件 :1023-1028），**没有图标位**；
*   · slot 契约里也没有：ui-slots 的 `KindOptions`（list 分支，:564-569）与
*     `StoredEntry.options`（:621-627）都只有 id / order / label / priority，
*     `settings.section` 的 owner props 只有 `{ close }`。
*
* `navIcon` 是 settings-general 模块内部的私有函数，外部拿不到引用，所以只能在
* **DOM 层**做：盯住设置面板（shell 用 `createPortal(..., document.body)` 直接挂在
* body 上）→ 按行标题认出我们那一行 → 打标记 → 用 CSS 盖住齿轮、画上我们的字形。
*
* ## 为什么是「打标记 + CSS」而不是「换掉那个 svg」
*
* 那个 `<svg>` 是 shell 的 React 节点。`replaceWith` 成自己的节点后，React 手里仍
* 攥着已脱离文档的旧 svg，那一行卸载时 React 会对它 `removeChild` →
* `NotFoundError` 直接崩。本模块**不动 DOM 结构**：只加一个 React 从不 diff 的
* `data-*` 属性，字形交给 `::before` + `mask` 画，React 全程无感。
*
* ## 认行只能靠标题文本
*
* 行里只有 id / order / label 三个字段，而投影到 DOM 的只有 label —— `<button>` 上
* 只有 class / aria-current / data-modal-autofocus，既没有 id 也没有 order。所以按标题
* 文本认。不能用 `:nth-child`：`account` 行是**条件出现**的（凭据存储后才注册），
* 位置会漂。
*
* ## 降级策略（保证绝不会把设置面板弄坏）
*
* 1. 环境缺 document / MutationObserver → 完全不装，只告警；
* 2. 图标渲不成 SVG（react-dom 不可用等）→ 完全不装，只告警（齿轮照旧）；
* 3. 认不出那一行 → 什么都不做（齿轮照旧），不报错；
* 4. 面板反复开关 → 观察者重新打标记，幂等。
*
* 将来 DSH 给 `settings.section` 加上 icon 选项后，删掉本模块与调用点即可。
*/
/** 注入的样式表去重标记（与宠物页面 / 设置页同一套 `data-plugin-css` 约定）。 */
const STYLE_TAG = "dsh-pet/nav-icon.css";
/** 打在目标行 `<button>` 上的标记属性：React 从不 diff 它，重渲染 / 切语言都不会掉。 */
const MARK = "data-dsh-pet-nav";
/** 设置面板根节点：shell 用 `createPortal(..., document.body)`（settings-general lib/client.js:341）。 */
const PANEL_SELECTOR = "[data-shortcut-modal=\"settings\"]";
/**
* 面板内部的类名来自 CSS Modules，**哈希前缀会随 DSH 构建变**（当前是 `VOzbGW_navList`），
* 但 `navList` / `navCell` / `navLabel` / `navIcon` 这些名字是源码里写死的
* （`"navIcon": "VOzbGW_navIcon"`），所以只匹配名字部分，不硬编码全名。
*/
const LIST_SELECTOR = "[class*=\"navList\"]";
const CELL_SELECTOR = "[class*=\"navCell\"]";
const LABEL_SELECTOR = "[class*=\"navLabel\"]";
function svgMaskUri(svg) {
	const source = svg.trim();
	if (source === "") return "";
	const namespaced = /<svg[^>]*\sxmlns=/i.test(source) ? source : source.replace(/<svg\b/i, "<svg xmlns=\"http://www.w3.org/2000/svg\"");
	return "url(\"data:image/svg+xml," + encodeURIComponent(namespaced.split("currentColor").join("#000")) + "\")";
}
/** 换字形用的 CSS：盖住齿轮，用 `::before` + mask 画上我们的图标。 */
function cssFor(glyph) {
	return [
		"/* 「桌宠配置」行的导航图标：见 dsh-pet/src/client/nav-icon.ts 的模块注释 */",
		"[" + MARK + "] [class*=\"navIcon\"]{display:none}",
		"[" + MARK + "]::before{content:\"\";flex:none;width:16px;height:16px;background-color:currentColor;-webkit-mask:" + glyph + " center/16px 16px no-repeat;mask:" + glyph + " center/16px 16px no-repeat}"
	].join("\n");
}
/** 注入样式表（只注入一次）。 */
function injectCss(doc, glyph) {
	if (doc.querySelector("style[data-plugin-css=\"" + STYLE_TAG + "\"]") !== null) return;
	const tag = doc.createElement("style");
	tag.dataset.plugin = "dsh-pet";
	tag.dataset.pluginCss = STYLE_TAG;
	tag.textContent = cssFor(glyph);
	doc.head.appendChild(tag);
}
/** 异常 → 单行文案（告警用）。 */
function describe(error) {
	return error instanceof Error ? error.message : String(error);
}
function installSectionNavIcon(target) {
	const doc = typeof document === "undefined" ? void 0 : document;
	const Observer = typeof MutationObserver === "undefined" ? void 0 : MutationObserver;
	if (doc === void 0 || Observer === void 0 || doc.body === null) {
		console.warn("[dsh-pet] 设置页导航图标不可用：缺少 document / body / MutationObserver（齿轮照旧）");
		return () => {};
	}
	let glyph;
	try {
		glyph = svgMaskUri(target.renderSvg());
	} catch (error) {
		console.warn("[dsh-pet] 设置页导航图标不可用：图标渲染失败（齿轮照旧）：" + describe(error));
		return () => {};
	}
	if (glyph === "") {
		console.warn("[dsh-pet] 设置页导航图标不可用：图标渲成了空 SVG（齿轮照旧）");
		return () => {};
	}
	injectCss(doc, glyph);
	let warned = false;
	/** 给面板里标题匹配的那一行打标记（幂等；已打过的不再读标题）。 */
	const markPanel = (panel) => {
		try {
			const wanted = target.label();
			if (wanted === "") return;
			const list = panel.querySelector(LIST_SELECTOR);
			if (list === null) return;
			for (const cell of list.querySelectorAll(CELL_SELECTOR)) {
				if (cell.getAttribute(MARK) !== null) continue;
				if (cell.querySelector(LABEL_SELECTOR)?.textContent === wanted) cell.setAttribute(MARK, "");
			}
		} catch (error) {
			if (!warned) {
				warned = true;
				console.warn("[dsh-pet] 设置页导航图标补丁异常，本次跳过（齿轮照旧）：" + describe(error));
			}
		}
	};
	let watched;
	let panelObserver;
	const sync = () => {
		const panel = doc.querySelector(PANEL_SELECTOR);
		if (panel === null) {
			panelObserver?.disconnect();
			panelObserver = void 0;
			watched = void 0;
			return;
		}
		markPanel(panel);
		if (panel === watched) return;
		panelObserver?.disconnect();
		watched = panel;
		panelObserver = new Observer(() => {
			markPanel(panel);
		});
		panelObserver.observe(panel, {
			childList: true,
			subtree: true
		});
	};
	sync();
	const bodyObserver = new Observer(sync);
	bodyObserver.observe(doc.body, { childList: true });
	return () => {
		bodyObserver.disconnect();
		panelObserver?.disconnect();
	};
}

//#endregion
//#region src/client/app.ts
function makeFactory() {
	return (require) => {
		const module = { exports: {} };
		const react = require("react");
		const { useEffect, useRef, useState, useCallback } = react;
		const { jsx: h } = require("react/jsx-runtime");
		let primitives;
		try {
			primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		} catch (error) {
			console.warn("[dsh-pet] 图标模块不可用：" + (error instanceof Error ? error.message : String(error)));
		}
		let renderIconSvg;
		try {
			const { createRoot } = require("react-dom/client");
			const { flushSync } = require("react-dom");
			renderIconSvg = (icon$1) => {
				const holder = document.createElement("div");
				const root = createRoot(holder);
				try {
					flushSync(() => root.render(h(icon$1, { size: 16 })));
					return holder.innerHTML;
				} finally {
					root.unmount();
				}
			};
		} catch (error) {
			console.warn("[dsh-pet] 图标渲染器不可用（react-dom 缺失）：" + (error instanceof Error ? error.message : String(error)));
		}
		const PetMulti = makePetUI({
			h,
			useState,
			useEffect,
			useRef
		});
		const name$1 = "pet";
		const inject = [
			"slots",
			"locale",
			"connection",
			"remote",
			"remote.commands",
			"commandUi"
		];
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-pet: dictionaries");
			const t = ctx.locale.bind(NS);
			ctx.effect(() => initNotify(), "dsh-pet: notifications");
			ctx.effect(() => {
				const commandUi = ctx.get?.("commandUi");
				if (!commandUi || typeof commandUi.decorate !== "function") {
					console.warn("[dsh-pet] 命令选择框不可用：commandUi 服务缺失（/pet 仍可手输 id 或名字）");
					return () => {};
				}
				return commandUi.decorate({
					name: "pet",
					available: () => true,
					ui: {
						kind: "popupSelect",
						options: async () => petBridge.current.map((p) => ({
							id: p.id,
							label: p.name || p.id,
							detail: (p.assetRoot && p.assetRoot !== p.id ? p.assetRoot + " / " : "") + p.id
						})),
						onSelect: async (option, session) => {
							await ctx.remote?.commands?.execute(session.sessionId, "/pet " + option.id, []);
						}
					}
				});
			}, "dsh-pet: /pet picker");
			ctx.effect(() => {
				const commandUi = ctx.get?.("commandUi");
				const icons = primitives;
				if (commandUi === void 0 || icons === void 0) {
					console.warn("[dsh-pet] 命令图标不可用（命令本身仍可用，只是没有图标）");
					return () => {};
				}
				return installCommandFaces(commandUi, new Map([
					["chat", {
						label: () => t("cmd.chat"),
						icon: icons.IconQueueOutlineRegular
					}],
					["pet", {
						label: () => t("cmd.pet"),
						icon: icons.IconUsersOutlineRegular
					}],
					["balance", {
						label: () => t("cmd.balance"),
						icon: icons.IconGaugeOutlineRegular
					}]
				]));
			}, "dsh-pet: command faces");
			ctx.effect(() => {
				const renderIcon = renderIconSvg;
				const icon$1 = primitives?.IconSlidersTwoOutlineMedium;
				if (renderIcon === void 0 || icon$1 === void 0) {
					console.warn("[dsh-pet] 设置页导航图标不可用（那一行仍是齿轮）");
					return () => {};
				}
				return installSectionNavIcon({
					label: () => t("nav"),
					renderSvg: () => renderIcon(icon$1)
				});
			}, "dsh-pet: settings nav icon");
			ctx.slots.inject("shell.overlay", function* () {
				yield ctx.slots.register({
					name: "shell.overlay",
					id: "pet",
					order: 1e3
				}, () => h(PetMulti, {}));
			});
			const PetConfigSection = makePetConfigSection({
				h,
				useState,
				useEffect,
				useRef,
				useCallback,
				t
			});
			ctx.slots.inject("settings.section", function* () {
				yield ctx.slots.register({
					name: "settings.section",
					id: "pet-config",
					order: 30,
					label: () => t("nav"),
					inject: () => ({ t })
				}, PetConfigSection);
			});
		}
		module.exports = {
			apply,
			inject,
			name: name$1
		};
		return module.exports;
	};
}

//#endregion
//#region src/client/index.ts
window.__ModuleLoader__.load({
	id: "dsh-pet",
	factory: makeFactory()
});

//#endregion
})();