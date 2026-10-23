# 结构与检查范围

角色数据在 assets/pets/*/pet.json；共享状态、交互、动作映射和图片播放器在 src/shared；DSH 的 client/host、独立宿主 standalone 和原生 electron-helper 是适配层。JONSBO renderer 从当前图片 canvas 或原有 WebM 画面合成 480×480 帧，经 IPC 和 bridge 交给屏幕输出。设备协议保留在 desktop/，不进入角色接口。

三个角色均通过 PetPack 注册。新角色不需要复制播放器；菜单、人格和动作从 manifest 读取。桥接的角色校验与屏幕控制台标签读取同一组 manifest，双人组合与时长读取场景数据。[接口](pet-pack.md)。

host/index.ts、原生 sprite.js 和浏览器 pet.ts 仍是较大的适配器，后续可继续拆路由、菜单和输入控制；当前共享业务规则已经独立，未把不同窗口 API 强行合并。

独立版位于 [Deepseek-and-ChatGPT-Pet](https://github.com/JoenardoQ/Deepseek-and-ChatGPT-Pet)，移除了屏幕设备层。两版在 DSH 中使用相同 dsh-pet 模块标识，按需求安装其中一个版本；独立桥接端口与数据目录各自隔离。

旧 GIF 制作链、生成中间文件及一次性脚手架已清理，[清理记录](cleanup-record.json) 说明范围。当前媒体、有效测试、用户参考图、版权及 394 条上游媒体/字体记录保留；Git 历史和原始工程归档不改写。

实际取帧、像素对比和原生 Electron 证据见 [本版验证](validation.md)。DSH 实际安装、插件加载和角色切换已验证；本版尚未进行物理 USB streaming 验收。
