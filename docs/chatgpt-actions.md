# ChatGPT 静态动作设计

先归纳动作类型，再确定姿态 prompt，最后生成透明 PNG 图集。每格是一张独立姿态，不插帧，不播放 GIF 或视频。

| 类型 | ID | 动作 | 姿态 prompt |
|---|---|---|---|
| 基础 | idle | 端庄待机 | Standing relaxed, hands gently resting in front, soft attentive smile. |
| 基础 | blink | 俏皮眨眼 | Standing with one eye closed in a playful wink, one hand near cheek. |
| 互动 | wave | 挥手问候 | Raising one open hand in a friendly wave, looking at the viewer. |
| 互动 | shy | 被夸害羞 | Blushing, looking slightly aside, shyly holding the edge of one sleeve. |
| 工作 | thinking | 认真思考 | One finger on chin, eyes thoughtfully looking upward, a small blue assistant orb nearby. |
| 工作 | working | 专心工作 | Typing with both hands on a small floating lavender laptop, focused expression. |
| 工作 | success | 完成庆祝 | Small victory V sign, proud warm smile, tail lifted happily. |
| 工作 | error | 遇到困难 | One hand touching forehead, apologetic worried face, wings gently drooping. |
| 工作 | waiting | 等待确认 | Holding a small clipboard toward the viewer, open palm requesting a decision. |
| 工作 | review | 核对结果 | Inspecting a notebook with a quill, carefully checking a completed list with no readable text. |
| 工作 | balance | 检查用量 | Holding a small open coin purse and thoughtfully counting a few glowing tokens. |
| 生活 | sleeping | 蜷尾小憩 | Sitting asleep with knees together, hands on knees, tail curled gently around feet. |
| 生活 | wake | 睡醒揉眼 | Sitting upright and rubbing one eye with a loose fist, sleepy smile. |
| 生活 | stretch | 放松伸展 | Standing and stretching both arms above head, eyes gently closed, wings partly stretched. |
| 生活 | tea | 捧杯喝茶 | Standing holding a porcelain teacup with both hands near lips, relaxed expression. |
| 生活 | snack | 偷吃点心 | Holding a little cookie near mouth, slightly puffed cheeks and a caught-in-the-act smile. |
| 生活 | reading | 安静阅读 | Reading an open book held with both hands, absorbed calm expression. |
| 生活 | garden | 照看花草 | Kneeling beside a small flowerpot and tilting a watering can, focused gentle smile. |
| 互动 | bow | 提裙行礼 | Holding both sides of the long skirt, knees slightly bent in an elegant curtsey. |
| 移动 | walk | 轻步散步 | Full-body walking pose in three-quarter view, one foot forward, arms relaxed. |
| 移动 | run | 轻快小跑 | Full-body running pose with bent arms and one knee raised, skirt and hair following naturally. |
| 互动 | drag | 被提起反应 | Surprised airborne pose, feet off the ground, arms spread slightly for balance, eyes wide. |
| 生活 | magic | 掌心星光 | Holding both palms open with a small blue glowing assistant orb above them, delighted expression. |
| 生活 | play | 休闲游戏 | Holding a game controller with both hands, focused playful grin. |

完整共用身份约束、图集排版和每次生成 prompt 见 `art-source/action-plan.json`。原版 106 个细分动作按语义映射到这 24 个姿态，未声称 106 张独立新画。两个 DeepSeek 角色的原媒体保持不变。
