# 颜色 / 字号 / 圆角 Token 映射表

> 自动生成（`node scripts/gen-token-map.mjs`），勿手改。改 token 请改 `scripts/tokens.json` 后重跑全部 gen-*。

本表是「换肤指南」：改 **value 列** 即整体换主题。codemod 已按本表把任意值/裸 hex 替换为语义类名或 `tk[...]`。

- 原始唯一色值：**127** 个 → 收敛为 **34** 个颜色 token（用户确认的「适度收敛 ~40」策略）
- 合并原则：仅合并「同属性族 + 感知相近」的色；不同语义的同色按 `属性+色值` 分别归类。

## 背景层 surface (bg / 渐变停 from·via·to)

| token | 类名前缀 | value | 说明 | 归并的原始色 |
|---|---|---|---|---|
| `--color-surface-deep` | `bg-surface-deep` | `#02060d` | 最深 scrim/遮罩底色 | `#080f1c` |
| `--color-surface-app` | `bg-surface-app` | `#0a1322` | 页面/外层最深背景 | `#09111d` `#0b1728` `#0c1524` `#0c1730` |
| `--color-surface-panel` | `bg-surface-panel` | `#0d1726` | 主面板背景（最常用） | `#0e1827` `#0d1a30` `#0f1a2d` `#0e1d31` |
| `--color-surface-elevated` | `bg-surface-elevated` | `#101b2c` | 略抬升表面 | `#101a2b` `#0f1b2f` `#0f1d30` `#111d30` |
| `--color-surface-raised` | `bg-surface-raised` | `#101d32` | 卡片/弹层表面 | `#12203a` `#13223a` `#11223c` `#14223a` |
| `--color-surface-input` | `bg-surface-input` | `#18263b` | 输入框/可交互区背景 | `#11253d` `#15294a` `#1e2f48` |
| `--color-surface-selected` | `bg-surface-selected` | `#1e3358` | 选中/hover 行背景 | `#243552` |
| `--color-surface-accent-soft` | `bg-surface-accent-soft` | `#1f3d6b` | 强调区淡背景 | `#2a3f5e` |
| `--color-surface-accent` | `bg-surface-accent` | `#2551b8` | 强调按钮背景 | `#2a5fda` |
| `--color-surface-accent-hover` | `bg-surface-accent-hover` | `#4a7ab5` | 强调按钮 hover | — |
| `--color-surface-warn` | `bg-surface-warn` | `#c69b3a` | 警示徽章背景 | — |
| `--color-surface-warn-soft` | `bg-surface-warn-soft` | `#4b3a10` | 警示淡背景 | — |

## 线条层 line (border / ring / outline)

| token | 类名前缀 | value | 说明 | 归并的原始色 |
|---|---|---|---|---|
| `--color-line-faint` | `border-line-faint` | `#162439` | 最弱分隔线 | `#1c2b42` `#1b2a42` `#18263b` `#172436` `#152437` |
| `--color-line` | `border-line` | `#1c2f49` | 常规边框 | `#1e2f48` `#1a2c45` `#18314f` `#1f2f48` |
| `--color-line-soft` | `border-line-soft` | `#253754` | 次级边框/网格线 | `#1c3150` `#1d3250` `#1c3050` `#22324d` `#203551` `#1e3352` `#1f3759` |
| `--color-line-strong` | `border-line-strong` | `#29476e` | 强调边框/激活态 | `#2a4164` `#2f456b` `#284164` `#25406a` `#29456c` `#264167` `#2a4a6e` `#2a4060` |
| `--color-line-focus` | `border-line-focus` | `#33507d` | 焦点环/拖拽高亮 | `#2a4a78` `#3a5a80` |
| `--color-line-accent` | `border-line-accent` | `#3c76f0` | 强调蓝边框 | `#3b76f3` `#3d74f1` |
| `--color-line-warn` | `border-line-warn` | `#ff8a26` | 警示橙边框 | `#94712a` |

## 文字·语义·图表色 ink (text / fill / stroke / chartPalette / 内联)

| token | 类名前缀 | value | 说明 | 归并的原始色 |
|---|---|---|---|---|
| `--color-accent` | `text-accent` | `#5ea3ff` | 主强调文字/图标 | `#60a5fa` `#93c5fd` |
| `--color-accent-strong` | `text-accent-strong` | `#3b82f6` | 强调蓝（深） | `#2563eb` `#1d4ed8` `#2f6fd0` `#3d74f1` |
| `--color-accent-muted` | `text-accent-muted` | `#7286d3` | 弱化强调蓝 | `#7090b0` |
| `--color-info` | `text-info` | `#2fc3de` | 信息青色 | `#22c1dc` `#8bc6de` |
| `--color-up` | `text-up` | `#f87171` | 上涨红 | `#ef5a6f` `#ea7878` `#ef4444` `#dc2626` |
| `--color-up-pink` | `text-up-pink` | `#f472b6` | 粉(特殊涨) | — |
| `--color-down` | `text-down` | `#34d399` | 下跌绿 | `#10b981` `#16a34a` `#4ade80` `#63b383` `#a9d57f` |
| `--color-warn` | `text-warn` | `#fbbf24` | 警示黄 | `#f59e0b` `#ca8a04` `#fde047` `#fef08a` `#f4cf68` |
| `--color-warn-strong` | `text-warn-strong` | `#d97706` | 警示橙(深) | `#fb923c` `#f6a960` |
| `--color-violet` | `text-violet` | `#a78bfa` | 紫(图表/标记) | `#8b5cf6` |
| `--color-text-primary` | `text-text-primary` | `#e5e7eb` | 主文字 | `#e2e8f0` `#d1d5db` `#ffffff` `#bfdbfe` |
| `--color-text-secondary` | `text-text-secondary` | `#9ca3af` | 次文字 | `#aaaaaa` `#cccccc` |
| `--color-text-muted` | `text-text-muted` | `#6b7280` | 弱文字 | `#888888` `#666666` `#475569` `#4b5563` |
| `--color-text-faint` | `text-text-faint` | `#374151` | 极弱文字/占位 | — |
| `--color-neutral` | `text-neutral` | `#1f1f1f` | 中性灰(图表/滚动条) | `#1a1a1a` `#2a2a2a` `#161616` `#1e1e1e` `#0d0d0d` |

## 字号 (text-)

| token | 类名 | value | 说明 |
|---|---|---|---|
| `--text-tag` | `text-tag` | `9px` | 极小标签 9px |
| `--text-mini` | `text-mini` | `10px` | 迷你说明 10px |
| `--text-note` | `text-note` | `11px` | 表格/密集文字 11px |
| `--text-body` | `text-body` | `12px` | 常规小字 12px |
| `--text-head` | `text-head` | `20px` | 标题 20px |

## 圆角 (rounded-)

| token | 类名 | value | 说明 |
|---|---|---|---|
| `--radius-xs` | `rounded-xs` | `2px` | 细微圆角 |

---

## 换肤指南

**唯一改动入口：`scripts/tokens.json`**。改完执行：

```bash
node scripts/gen-tokens-css.mjs   # -> src/styles/tokens.css   (Tailwind @theme，CSS 类用)
node scripts/gen-tokens-ts.mjs    # -> src/styles/tokens.gen.ts (SVG/图表/内联，运行时真实 hex)
node scripts/gen-token-map.mjs    # -> 本文档
```

- 改某 token `value` → 该语义所有位置（CSS 类 + 图表 + SVG + 内联）整体换色。
- 两套产物同源 `tokens.json`：CSS 类走 `tokens.css`；SVG 属性 (`stroke`/`stopColor`) 与 `chartPalette` 走 `tokens.gen.ts`（CSS `var()` 在 SVG 呈现属性中无效）。
- Tailwind v4 按需裁剪：仅被用到的 token 类才会生成 `--color-*`；纯 `tk[...]` 引用的语义色（如 up/down/chart）不产出 CSS 变量，由 ts 模块保真，属预期。

### 刻意未 token 化（视觉零回归 / 收益低）

- 11 处 `shadow-[… rgba() …]` / `linear-gradient(rgba())` 网格底纹：半透明微弱叠加，保留字面值。
- `src/styles/tailwind.css` 滚动条颜色：纯 CSS，不在 124 用色审计内。
- 间距类任意值（`w-[..]`/`gap-[..]`）：一次性布局常量，非设计阶梯。
- Tailwind 命名色类（`text-emerald-400`、`text-slate-100` 等）：本就是 Tailwind 调色板。
