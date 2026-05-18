# 主题（Theme）说明

> 手写文档，说明「当前主题如何确定」与「有哪些变量」。
> 颜色 token 的**逐条清单**自动生成于 [`docs/color-token-map.md`](./color-token-map.md)（改 token 看那里）。

## TL;DR

- **没有主题切换**：无亮/暗 toggle、不读系统 `prefers-color-scheme`。界面看到的深色是**写死的值**。
- **两套独立的颜色系统并存**：
  1. **设计 token（业务看板用）** — 本次建立，单一真源 `scripts/tokens.json`。
  2. **遗留 shadcn 主题（仅 `ui/` 基础组件用）** — `src/styles/theme.css`，是 shadcn 默认**浅色**主题。
- 改业务看板配色 = 改 `tokens.json` 重跑生成器；**不影响** `ui/` 基础组件（那套要单独改 `theme.css`）。

## 主题是怎么确定的

样式入口 `src/styles/index.css`，按顺序导入：

```
fonts.css      字体
tailwind.css   Tailwind v4 + 滚动条样式（滚动条颜色为字面 hex，未 token 化）
tokens.css     ← 系统①：设计 token（@theme，本次新增，自动生成）
theme.css      ← 系统②：遗留 shadcn 主题（:root + .dark + @theme inline）
```

Tailwind v4 是 CSS-first，无 `tailwind.config.js`。两个 `@theme` 块都注册，但**变量名不相交**所以互不覆盖：

| | 系统① 设计 token | 系统② shadcn theme.css |
|---|---|---|
| 文件 | `tokens.css`（由 `tokens.json` 生成） | `theme.css`（手写，模板自带） |
| 变量名 | `--color-surface-*` `--color-line-*` `--color-accent` … `--text-*` `--radius-xs` | `--background` `--primary` `--border` `--chart-1..5` `--radius` … |
| 谁在用 | 业务看板：`src/app/App.tsx` + `components/{Left,Center,Right}Panel.tsx` `MarketChartPage.tsx` | 仅 `src/app/components/ui/*`（Radix/shadcn 原子组件，如 alert-dialog/slider/sheet） |
| 形态 | 单一写死的深色；无切换 | 默认**浅色**；含 `.dark` 块但**从未挂 `.dark` 类**，故 ui 组件实际走浅色 |
| 换肤方式 | 改 `tokens.json` → 重跑生成器 | 手改 `theme.css` |

> 注意：业务看板**不用** shadcn 那套（不写 `bg-background`/`border-border`），所以 `theme.css` 是浅色也不影响看板观感；它只决定散落使用的 shadcn 原子组件外观。

### 设计 token 的两种产物（同源 `tokens.json`）

| 产物 | 给谁用 | 为什么 |
|---|---|---|
| `src/styles/tokens.css`（`@theme`） | Tailwind 工具类：`bg-surface-panel` `border-line-strong` `text-accent` `text-note` `rounded-xs` … | CSS 类场景 |
| `src/styles/tokens.gen.ts`（`export const tk`） | SVG 属性（`stroke`/`stopColor`）、`chartPalette`、内联 `style={{}}` | CSS `var()` 在 SVG 呈现属性中无效，这里需运行时**真实 hex** |

Tailwind v4 按需裁剪：只有被当作**类名**用到的 token 才产出 `--color-*`；纯 `tk[...]` 引用的语义色（如 up/down、图表色）不产出 CSS 变量，由 ts 模块保真——属预期。

## 有哪些变量

### 系统①：设计 token（共 44 个，权威清单见 color-token-map.md）

**颜色 `--color-*`（38）**

- 背景层 `surface`（13）：`surface-deep` `surface-app` `surface-panel` `surface-elevated` `surface-raised` `surface-input` `surface-selected` `surface-accent-soft` `surface-accent` `surface-accent-hover` `surface-warn` `surface-warn-soft` `surface-chart`
- 线条层 `line`（9）：`line-faint` `line` `line-soft` `line-strong` `line-focus` `line-accent` `line-warn` `line-chart` `line-chart-strong`
- 文字·语义·图表 `ink`（16）：`accent` `accent-strong` `accent-muted` `info` `up`(涨红) `up-pink` `down`(跌绿) `warn` `warn-strong` `violet` `text-primary` `text-secondary` `text-muted` `text-faint` `neutral` `on-accent`

**字号 `--text-*`（5）**：`text-tag`(9px) `text-mini`(10px) `text-note`(11px) `text-body`(12px) `text-head`(20px)

**圆角 `--radius-*`（1）**：`radius-xs`(2px)

> 每个 token 的 value、用途、归并了哪些原始色 → [`docs/color-token-map.md`](./color-token-map.md)。

### 系统②：shadcn `theme.css`（约 110 个变量，模板自带，未纳入本次 token 化）

- `:root`（浅色，~30）：`--background` `--foreground` `--card(-foreground)` `--popover(-foreground)` `--primary(-foreground)` `--secondary(-foreground)` `--muted(-foreground)` `--accent(-foreground)` `--destructive(-foreground)` `--border` `--input` `--input-background` `--switch-background` `--ring` `--chart-1..5` `--sidebar*` `--radius` `--font-size` `--font-weight-*`
- `.dark`（第 44 行起，深色覆盖，**当前无 `.dark` 类故不生效**）
- `@theme inline`（第 81 行起，把上面 `:root` 变量映射成 Tailwind `color-*` 工具类供 ui 组件用）

## 如何换肤

**业务看板**（绝大多数界面）：

```bash
# 1. 改 scripts/tokens.json 里某 token 的 value
# 2. 重跑生成器（codemod 不必再跑）
node scripts/gen-tokens-css.mjs
node scripts/gen-tokens-ts.mjs
node scripts/gen-token-map.mjs
```

**shadcn 原子组件**（散落的弹窗/滑块/抽屉等）：直接改 `src/styles/theme.css` 的 `:root`（或给根节点挂 `.dark` 并完善 `.dark` 块）。

## 刻意未 token 化（保持视觉零回归 / 收益低）

- `tailwind.css` 滚动条颜色（纯 CSS，不在 124 用色审计内）
- 11 处 `shadow-[… rgba() …]` / 网格 `linear-gradient(rgba())`（半透明微弱叠加）
- 布局尺寸任意值 `w-[..]`/`gap-[..]`（一次性常量，非设计阶梯）
- Tailwind 命名色类 `text-emerald-400`/`text-slate-100` 等（本就是 Tailwind 调色板）
- `theme.css` 整套 shadcn 变量（属系统②，独立维护）
