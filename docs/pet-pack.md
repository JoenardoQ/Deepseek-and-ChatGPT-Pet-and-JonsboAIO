# PetPack v1 接口

实现：`dsh-pet/src/shared/pet-pack.ts`。每个角色自包含于 `assets/pets/<id>/`。

## 最小角色

新建 `dsh-pet/assets/pets/my-pet/pet.json`，以及透明图片 `images/idle.png`：

```json
{
  "schema": 1,
  "id": "my-pet",
  "label": "我的桌宠",
  "persona": {
    "prompt": "你是一个友好的桌宠，回答简洁。",
    "work": [["让我想想"], ["正在处理"], ["正在检查"], ["等待确认"], ["完成啦"], ["遇到问题"]]
  },
  "menu": "actions",
  "dialogue": "original",
  "actions": [
    {"id": "idle", "label": "待机", "category": "基础", "file": "images/idle.png", "kind": "image", "durationMs": 4000}
  ],
  "states": {"idle": "idle"},
  "aliases": {}
}
```

运行 `npm run build`，构建脚本发现所有角色包并生成 `generated-packs.ts`。不要手改生成文件。重新启动后角色会出现在切换菜单中。

## 字段与扩展点

- `id` 与目录名一致，匹配 `[a-z][a-z0-9-]{0,63}`；同一注册表不能重名。
- `actions` 每项 ID 唯一，`label` 为菜单文字，`category` 为菜单分组。`durationMs` 为 100–60000ms，表示一次姿势驻留/动作生命周期。
- `kind: image` 支持 PNG/WebP，`kind: video` 支持 WebM。文件只允许放在本包 `images/` 或 `webm/`，不接受远程 URL、目录穿越或执行脚本。
- 图片图集可设置 `cell: {"columns":4,"rows":2,"index":0}`，从左到右、从上到下，index 从 0 开始；省略时使用整张图片。
- `states` 至少有 `idle`。常见语义有 `blink`、`wave`、`drag`、`walk`、`run`、`sleeping`、`wake`、`thinking`、`working`、`review`、`waiting`、`success`、`error`、`balance`。缺失状态回退到 idle。
- `aliases` 将已有动作名字或事件映射到本包 action ID。ChatGPT 的全部旧细分动作保留在此映射中，动作来源记录见 `art-source/legacy-action-map.json`。
- `persona.work` 六组台词依次为思考、工作、检查、等待、成功、错误。`prompt` 是角色的对话人格。
- `menu: actions` 按本包动作生成菜单；`upstream` 保留原大肥鱼自定义动画菜单和目录覆盖行为，新角色通常使用 actions。
- `dialogue: original` 复用原表情目录；`translated` 使用当前角色 `memes/` 中的中文表情文件，文件名对应 `DIALOGUE_IMAGES`。若不提供自有表情，使用 original。

底层 API：`validatePetPack`、`registerPetPack`、`petPacks`、`getPetPack`、`hasPetPack`、`resolvePackAction`。普通扩展使用目录构建入口；程序化注册必须在创建菜单/渲染器前完成。动作事件标识为 `__pack-<角色id>-<动作id>`。

## 双人组合

在 `assets/pets/duo/actions.json` 增加静态场景：

```json
{
  "id": "greet-new-friend",
  "label": "新朋友见面",
  "participants": ["fish", "my-pet"],
  "file": "images/friends.png",
  "kind": "image",
  "durationMs": 9000,
  "cell": {"columns": 1, "rows": 1, "index": 0}
}
```

文件放在 duo 目录。仲裁器按双方心跳报告的角色与 participants 匹配，不写死 fish/chatgpt。自动模式只轮换适合当前组合的场景，并使用各场景 durationMs。原生桌面中独立宿主负责显示成对场景；DSH 侧在有效租约期间暂时隐藏单角色，连接失效后恢复。

当前内置图片仅有 fish + chatgpt；添加新组合需要对应两位角色的真实新图，不能只改 participants 就宣称完成美术。

## 验证

`npm run build` 检查目录、声明资源和图集；`npm test` 检查已注册角色、旧事件映射、非法路径和新增角色的菜单/资源行为。静态图集可以加入 preview 页面或用浏览器手动检查，再验收原生透明窗口。不要只依据文件存在判断图像质量。
