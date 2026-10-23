# 开发与维护

当前静态图片版本为 1.2.0，已合并多实例和重连维护修复；桥接修订为 r2。版本号来自 `dsh-pet/package.json`，协议与维护修订集中在 `dsh-pet/bridge/version.mjs`。修订号让同一素材版本的旧桥接安全迁移，更新版服务和无关服务不被关闭。

## 模块边界

| 模块 | 职责 |
| --- | --- |
| `bridge/sources.mjs` | 以宿主加窗口实例 ID 保存独立心跳、帧、稳定选择；心跳 6 秒、帧 3 秒租约 |
| `bridge/projection.mjs` | 每实例投屏意图、预览租约、重连代数；不管理桌面窗口 |
| `bridge/state.mjs` | MCP 会话控制与聚合；继续导出 Sources 以兼容原入口 |
| `bridge/duets.mjs` | 选择并保留一个合格的双人组合，退出后恢复各自状态 |
| `bridge/server.mjs` | 本机 HTTP 验证、进程生命周期、将上述状态发送给 USB worker |
| `runtime/electron-helper/jonsbo-main.cjs` | 给每个真实窗口分配身份，双人互动只暂隐参与者 |
| `runtime/electron-helper/jonsbo-renderer.js` | 使用原动画播放器合成完整画面，按需求编码 PNG |
| `desktop/frame_worker.py` | 处理最新画面、旋转、SDK 释放与重连；旧实例画面不会用于新实例 |
| `bridge/preview.html` / `.css` / `.js` | 页面结构、样式、界面状态和交互分别维护 |
| `src/client/settings-locales.ts` / `settings-styles.ts` | 设置页的双语文案与样式；组件保留在 settings.ts |

对外协议仍为 4。旧的 host-only 字段与路由保留；新界面使用 `pets`、`selectedInstance`、`screenInstance` 和 `instanceId`。宿主级旧开关作用于整个宿主，新窗口级开关只作用于那个实例。MCP 控制会话与桌宠窗口是两个不同概念。

快速关开时，每次请求递增 generation。即使 worker 的最新帧队列合并掉中间的“关”，最终 generation 的变化仍会关闭旧 SDK 会话并立即重试。worker 回报 generation 和 streamId，页面只有在这两项与当前选择匹配时才显示正在投屏。

未投屏且没有预览时，停止 PNG 编码，但继续原桌面动画和独立心跳。打开预览后维持 2.5 秒的捕获需求，预览最多 8 fps、投屏最多 24 fps；隐藏页面后租约自然过期。预览保持正向，旋转只应用于实际 USB 输出。

## 构建与校验

CI 使用 npm 和 `dsh-pet/package-lock.json`，开发时以这份锁为准。安装时跳过脚本，构建明确执行，不依赖安装副作用。

```powershell
npm --prefix dsh-pet ci --ignore-scripts --legacy-peer-deps
npm --prefix dsh-pet run typecheck
npm --prefix dsh-pet run lint
npm --prefix dsh-pet run format:check
npm --prefix dsh-pet test
npm --prefix dsh-pet run build
node dsh-pet/node_modules/playwright/cli.js install chromium
npm --prefix dsh-pet run test:ui
```

桥接测试应使用隔离目录，避免读写个人设置：

```powershell
$env:PET_DATA_DIR = Join-Path $env:TEMP 'pet-maintenance-test/jonsbo'
$env:DSH_HOME = Join-Path $env:TEMP 'pet-maintenance-test/dsh'
$env:DESKTOP_PET_HEADLESS = '1'
$env:PET_SKIP_RUNTIME_SETUP = '1'
node --test dsh-pet/test-jonsbo/*.test.mjs test/*.test.mjs
python -m unittest discover -s dsh-pet/test-jonsbo -p 'test_*.py'
node scripts/test-screen-frames.mjs
node scripts/test-screen-room.mjs
```

浏览器测试默认使用 Playwright Chromium，也可通过 `PET_BROWSER_PATH` 指定本机 Chrome。设置页测试使用真实 React 与 HTTP 夹具；放映室测试模拟两个 DSH 窗口和一个 GPT 窗口；GIF 测试使用真实素材验证逐帧变化、结束回调、暂停恢复、对话插图与文字合成。

直接 GitHub 安装依赖仓库中的 `lib` 和 `shared-core.js`，因此源码变更后必须重建并提交产物。CI 会再次构建并检查差异。构建脚本不再覆盖 package.json 的 files 清单，防止漏掉屏幕背景。

## 保留与验证边界

原动画、图片、字体、物理交互、右键菜单、额度、对话和双宿主功能保持。394 项上游素材由现有 inventory 按 SHA-256 验证。本轮没有重新生成素材，也没有更改动画质量评审结果。

自动化证明软件状态、画面合成、安装包内容与启动流程；实际 USB 设备的画面方向、厂商 SDK 与官方软件接管仍需连接实机确认。测试中的 launch:false 不会唤起用户桌宠或接管屏幕。

并发启动的短生命周期 CLI 在等待 HTTP 状态请求时保持事件循环存活，成功或失败后立即释放。回归测试模拟无其他活跃句柄的异步响应，防止 Node 以退出码 13 提前结束。
