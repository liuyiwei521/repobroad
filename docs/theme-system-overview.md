# 资金实时行情看板 — 主题系统总览

> 最后更新：2026-06-23
>
> 本文档描述 React 看板的完整主题体系，包括暗色/白色双主题的架构、CSS 变量映射、组件覆盖策略和开发约定。

---

## 1. 架构概要

```
src/styles/
├── fonts.css                # @font-face 定义
├── tailwind.css             # Tailwind 配置 + 自定义 utility (text-micro, text-mini)
├── theme.css                # Shadcn/Radix 基础主题
├── tdx-theme.css            # TDX 暗色主题 — :root 变量层 (163 行)
├── tdx-react.css            # TDX 暗色主题 — React 组件样式层 (438 行)
└── react-whiteboard.css     # 白板主题 — 覆盖层 (652 行，最后加载)
```

**加载顺序（index.css）：**

```css
@import './fonts.css';
@import './tailwind.css';
@import './theme.css';
@import './tdx-theme.css';
@import './tdx-react.css';
@import './react-whiteboard.css';   /* ← 必须最后，覆盖暗色 */
```

**核心策略：** 暗色主题由 `tdx-theme.css` + `tdx-react.css` 定义。白板主题通过 `react-whiteboard.css` 在最后加载，以 CSS 优先级覆盖所有暗色变量和 Tailwind 工具类，无需修改 JSX。

---

## 2. 变量体系

主题使用三层 CSS 变量命名空间：

| 命名空间 | 前缀 | 用途 | 示例 |
|---------|------|------|------|
| TDX 原子变量 | `--tdx-*` | 基础设计 Token（色值、字号、间距） | `--tdx-bg-page`, `--tdx-text-main` |
| TK 语义变量 | `--tk-color-*`, `--tk-font-*` | 组件级语义 Token | `--tk-color-brand-primary`, `--tk-font-size-xs` |
| Shadcn 桥接变量 | `--background`, `--foreground`, `--primary` 等 | Tailwind/Shadcn 兼容层 | `--border`, `--ring`, `--muted` |

### 2.1 暗色主题核心 Token（tdx-theme.css）

| 变量 | 暗色值 | 说明 |
|------|--------|------|
| `--tdx-bg-page` | `#0d0d13` | 页面底色 |
| `--tdx-bg-panel` | `#15151d` | 面板底色 |
| `--tdx-bg-header` | `#292835` | 面板头/表头 |
| `--tdx-bg-control` | `#20202b` | 输入框/按钮底色 |
| `--tdx-border` | `#2f2e3a` | 主边框 |
| `--tdx-border-weak` | `#24232d` | 分割线 |
| `--tdx-text-main` | `#d8c8ab` | 正文（暖金色） |
| `--tdx-text-muted` | `#8f8d99` | 辅助文字 |
| `--tdx-text-heading` | `#f1e6cf` | 标题 |
| `--tdx-red` | `#e7353a` | 涨/品牌 |
| `--tdx-green` | `#00a85a` | 跌 |
| `--tdx-yellow` | `#d6a541` | 警告/金 |
| `--tdx-blue` | `#3b79b7` | 图表蓝 |

### 2.2 白板主题核心 Token（react-whiteboard.css）

> 来源：TDX PUI 1.3.44 白色主题（`--brandPrimary: #b42f32`）

| 变量 | 白板值 | TDX PUI 来源 |
|------|--------|-------------|
| `--tdx-bg-page` | `#ffffff` | `--bkColorContent` |
| `--tdx-bg-panel` | `#ffffff` | `--bkColorContent` |
| `--tdx-bg-header` | `#f5f5f5` | `--bkColorTag` |
| `--tdx-bg-control` | `#ffffff` | `--bkColorContent` |
| `--tdx-border` | `#dddddd` | `--borderColorBase` |
| `--tdx-border-weak` | `#eeeeee` | `--dividerColorBase` |
| `--tdx-text-main` | `#333333` | `--colorBaseText` |
| `--tdx-text-muted` | `#999999` | `--colorTextSecondary` |
| `--tdx-text-heading` | `#333333` | `--colorBaseText` |
| `--tdx-red` | `#f01414` | `--colorTextUp` |
| `--tdx-green` | `#14a014` | `--colorTextDown` |
| `--tdx-yellow` / `--tdx-orange` | `#fa7602` | `--brandAuxiliary` |
| `--tdx-blue` | `#4691f7` | `--brandAuxiliary2` |
| `--tk-color-brand-primary` | `#b42f32` | `--brandPrimary` |

---

## 3. 字体系统

### 3.1 字体栈

| 用途 | 暗色主题 | 白板主题 |
|------|---------|---------|
| 中文正文 | PingFang SC, Microsoft YaHei, Helvetica Neue, Arial | Microsoft YaHei, 微软雅黑, Arial, 宋体 |
| 数字/价格 | DIN Alternate, Helvetica Neue, Arial | Arial, Helvetica Neue |

### 3.2 字号规格

| 级别 | 变量 | 值 | 用途 |
|------|------|-----|------|
| Display | `--tdx-font-size-display` | 22px | 大数字展示 |
| XXL | `--tdx-font-size-xxl` | 20px | 主指标 |
| XL | `--tdx-font-size-xl` | 18px | 副指标 |
| LG (Head) | `--tdx-font-size-lg` | 16px | 页面标题 |
| MD (Base) | `--tdx-font-size-md` | 14px | 正文/表格内容 |
| SM | `--tdx-font-size-sm` | 13px | 次级正文 |
| XS (Caption) | `--tdx-font-size-xs` | 12px | 表头/标签 |
| Mini | `--tdx-font-size-mini` | 11px | 紧凑按钮 |
| Micro | `--tdx-font-size-micro` | 10px | 极小标注 |

### 3.3 行高

| 用途 | 暗色 | 白板 |
|------|------|------|
| 表格行 | 28px | 32px |
| 表头行 | 30px | 32px |
| 紧凑行 | 16px | 16px |

全局启用 `font-variant-numeric: tabular-nums` 保证数字等宽对齐。

---

## 4. 间距系统

| 级别 | 暗色 | 白板 |
|------|------|------|
| XXS | 2px | 1px |
| XS | 4px | 4px |
| SM | 8px | 8px |
| MD | 12px | 10px |
| LG | 16px | 20px |
| XL | 20px | 30px |
| XXL | 24px | 40px |

白板主题间距略大，匹配 TDX PUI 白色主题的宽松节奏。

---

## 5. 圆角系统

| 级别 | 暗色 | 白板 |
|------|------|------|
| XS | 1px | 2px |
| SM | 2px | 4px |
| MD | 4px | 6px |
| LG | 6px | 8px |
| Pill | 999px | 999px |

白板圆角全部比暗色大 2px，风格更圆润。

Tailwind 圆角类覆盖规则：
```css
.rounded-lg, .rounded-xl, .rounded-2xl → 6px (白板) / 4px (暗色)
.rounded-md → 4px (白板) / 4px (暗色)
```

---

## 6. Tailwind 暗色类覆盖策略

App.tsx 中使用了约 **380 个** 硬编码 Tailwind `slate-*` / `bg-[#hex]` 类。白板主题通过 CSS `!important` 覆盖批量重映射，无需修改 JSX。

### 6.1 文字色映射

| Tailwind 类 | 暗色含义 | 白板覆盖 | TDX PUI 级别 |
|-------------|---------|----------|-------------|
| `text-slate-100` ~ `200` | 高亮文字 | `#333333` | 主文字 |
| `text-slate-300`, `600` | 次要文字 | `#666666` | 重要 |
| `text-slate-400` ~ `500` | 辅助文字 | `#999999` | 次要 |
| `text-slate-700` ~ `800` | 深色文字 | `#333333` | 主文字 |
| `text-amber-300/400` | 金色 | `#fa7602` | 品牌辅助 |
| `text-emerald-300/400` | 绿色 | `#14a014` | 跌 |
| `text-red-300/400` | 红色 | `#f01414` | 涨 |
| `text-blue-*`, `sky-*`, `cyan-*` | 蓝色系 | `#4691f7` | 品牌辅助蓝 |

> **注意：** `.text-white` 不做全局覆盖——仅用于彩色背景 badge 上的白字。

### 6.2 背景色映射

| Tailwind 类 | 白板覆盖 |
|-------------|----------|
| `bg-slate-700` ~ `900` | `#ffffff` |
| `bg-slate-600` | `#f5f5f5` |
| `bg-slate-500` | `#eeeeee` |
| `bg-[#15151d]`, `bg-[#0d0d13]`, `bg-[#20202b]` 等 | `#ffffff` |
| `bg-[#292835]`, `bg-[#2a2935]` | `#f5f5f5` |
| `bg-blue-*/sky-*/cyan-*` 半透明 | `rgba(180,47,50,0.08)` (品牌红底) |

### 6.3 边框色映射

| Tailwind 类 | 白板覆盖 |
|-------------|----------|
| `border-slate-600` ~ `800` | `#dddddd` |
| `border-slate-500` | `#cccccc` |
| `border-slate-200` | `#eeeeee` |
| `border-[#2f2e3a]` | `#dddddd` |
| `border-white/10` ~ `20` | `rgba(221,221,221,0.4)` |

### 6.4 阴影映射

白板主题弱化所有阴影，面板靠边框区分层级：

```css
.shadow, .shadow-lg ~ 2xl → 0 1px 3px rgba(0,0,0,0.06)
```

---

## 7. 组件规范对照

### 7.1 按钮 `.tk-button`

| 属性 | 暗色 | 白板 |
|------|------|------|
| 默认背景 | `#20202b` | `#ffffff` |
| 默认边框 | `#2f2e3a` | `#dddddd` |
| 默认文字 | `#8f8d99` | `#999999` |
| Hover 背景 | `#1d1c27` | `#f5f5f5` |
| Hover 边框 | `#e7353a` | `#b42f32` |
| 选中背景 | `red-deep 58% mix` | `rgba(180,47,50,0.08)` |
| 选中文字 | `#f1e6cf` | `#b42f32` |

尺寸（两主题一致）：

| 类型 | 高度 | 字号 |
|------|------|------|
| 标准 | 28px | 12px |
| 迷你 `.text-mini` | 24px | 11px |
| 微型 `.text-micro` | 20px | 10px |

### 7.2 表格 `.tk-table`

| 属性 | 暗色 | 白板 |
|------|------|------|
| 行高 | 28px | 32px |
| 表头背景 | `#292835` | `#f5f5f5` |
| 表头文字 | `#8f8d99` | `#666666` |
| 表头字号 | 继承 | 12px |
| 行文字 | `#d8c8ab` | `#333333` |
| 行字号 | 继承 | 14px |
| 偶数行 | 半透明 hover | `#fafafa` |
| Hover 行 | `#1d1c27` | `#f5f5f5` |
| 单元格内边距 | 继承 | `0 10px` |

### 7.3 面板 `.tk-panel`

| 属性 | 暗色 | 白板 |
|------|------|------|
| 背景 | `#15151d` | `#ffffff` |
| 边框 | `#2f2e3a` | `#dddddd` |
| 阴影 | none | none |
| 面板头背景 | `#292835` | `#f5f5f5` |
| 面板头边框 | `#2f2e3a` | `#eeeeee` |

### 7.4 输入框 `.tk-field`

| 属性 | 暗色 | 白板 |
|------|------|------|
| 背景 | `#20202b` | `#ffffff` |
| 边框 | `#2f2e3a` | `#dddddd` |
| 聚焦边框 | `#e7353a` | `#b42f32` |
| Placeholder | — | `#cccccc` |

### 7.5 滚动条

| 属性 | 暗色 | 白板 |
|------|------|------|
| 轨道 | `#101018` | `#f5f5f5` |
| 滑块 | `#3a3845` | `#cccccc` |
| 滑块 Hover | `#54515f` | `#aaaaaa` |

---

## 8. 语义颜色系统

### 8.1 涨跌色（A 股惯例）

| 含义 | 暗色 | 白板 |
|------|------|------|
| 涨（红） | `#e7353a` | `#f01414` |
| 跌（绿） | `#00a85a` | `#14a014` |
| 警告（黄/橙） | `#d6a541` | `#fa7602` |

### 8.2 品牌色

| 用途 | 暗色 | 白板 |
|------|------|------|
| 品牌主色 | `#e7353a` (红) | `#b42f32` (暗红) |
| 品牌 Hover | `#ff494e` | `#c93a3d` |
| 品牌 Deep | `#8f2026` | `#932628` |

### 8.3 图表色板

| 名称 | 暗色 | 白板 |
|------|------|------|
| 蓝 | `#3b79b7` | `#4691f7` |
| 紫 | `#7a4aa1` | `#7c75cb` |
| 金 | `#d6a541` | `#faba02` |
| 绿 | `#00a85a` | `#14a014` |
| 红 | `#e7353a` | `#f01414` |
| 橙 | `#c76a25` | `#fa7602` |

---

## 9. 开发约定

### 必须遵守

1. **变量优先** — 新组件必须使用 `--tdx-*` 或 `--tk-color-*` 变量，禁止硬编码色值
2. **语义类优先** — 涨跌色用 `.tk-positive` / `.tk-negative`，不直接写 `color: #f01414`
3. **tabular-nums** — 所有数字列使用 `font-variant-numeric: tabular-nums`，价格列右对齐
4. **白板 CSS 最后加载** — `react-whiteboard.css` 必须是 index.css 最后一个 import
5. **不动 JSX** — 白板主题的颜色修改通过 CSS 覆盖，不修改 App.tsx 中的 Tailwind 类名

### 禁止事项

1. **禁止全局覆盖 `.text-white`** — 它仅用于彩色背景上的白字（badge、tag）
2. **白板面板不加 box-shadow** — 用 1px 边框区分层级
3. **不要在白板主题用蓝色做品牌色** — 品牌色统一为 `#b42f32`（红）
4. **不在 tdx-theme.css / tdx-react.css 中做白板相关修改** — 所有白板覆盖集中在 react-whiteboard.css

### 测试保障

```javascript
// src/app/themeImports.test.mjs
// 验证白板 CSS 在 tdx-react.css 之后加载
test("whiteboard must load after tdx-react", () => {
  const indexCss = fs.readFileSync(indexCssPath, "utf8");
  const reactPos = indexCss.indexOf("tdx-react.css");
  const wbPos = indexCss.indexOf("react-whiteboard.css");
  assert.ok(wbPos > reactPos);
});
```

---

## 10. 白板主题 CSS 结构（react-whiteboard.css）

| 章节 | 行范围 | 内容 |
|------|--------|------|
| 1 | 15-158 | `:root` 自定义属性覆盖（所有 --tdx-* 和 --tk-color-* Token） |
| 2 | 164-174 | 基础元素（html/body/#root） |
| 3 | 180-215 | 结构组件（.tk-app-shell, .tk-topbar, .tk-panel, .tk-panel-header） |
| 4 | 221-247 | 排版（.tk-page-title, .tk-positive/negative/warning） |
| 5 | 252-286 | 按钮 & 标签（.tk-button, .tk-chip, .tk-badge） |
| 6 | 292-316 | 表格（行高、斑马纹、hover） |
| 7 | 322-331 | 输入框 |
| 8 | 337-350 | 工具提示 & 弹窗 |
| 9 | 356-364 | 信息芯片 & 状态徽章 |
| 10 | 370-389 | 浅色滚动条 |
| 11 | 397-550 | **Tailwind 暗色类批量重映射**（核心，约 150 条规则） |
| 12 | 556-618 | 特定组件补丁（情绪芯片、券商标签、圆角、placeholder） |
| 13 | 624-652 | 全局密度微调（紧凑面板内边距、分段标签页） |

---

## 附录 A：TDX PUI 1.3.44 白色主题来源映射

详见 [tdx-pui-white-theme-spec.md](tdx-pui-white-theme-spec.md) — 完整的 TDX PUI CSS 变量 → 项目变量映射表。

## 附录 B：当前分支与提交

- **分支：** `codex/react-dashboard-tdx-theme-alignment`
- **关键提交：**
  - `43825b25` — 完整 tk-color Token 体系和组件覆盖
  - `7b87a805` — 激活白板主题（CSS import 链）
  - `9b3a149a` — 对齐 TDX PUI 1.3.44 白色主题 Token
