# 泰康询价助手 UI 设计规范

本规范基于 `index.html` 中的 Sketch MeaXure 导出数据整理，适用于询价助手弹窗、设置面板、联系人选择、报价发送等相关界面。主题 token 见 `theme/tokens.json`，CSS 变量见 `theme/theme.css`。

## 1. 设计定位

询价助手属于交易工作台里的高频操作工具，界面应优先保证信息密度、可扫描性和操作效率。视觉风格以克制、清晰、专业为主，不做装饰性大色块，不使用营销式卡片堆叠。

核心原则：

- 信息优先：字段、状态、列表和操作按钮必须比装饰元素更醒目。
- 层级清晰：标题、标签、正文、辅助提示要有稳定的字号和颜色层级。
- 操作紧凑：弹窗和下拉层尽量减少留白，但控件点击区域不能过小。
- 状态可辨：选中、禁用、悬浮、危险、成功等状态使用语义色，不只依赖文字说明。

## 2. 画布与页面

导出文件包含 3 个主要设计画板：

| 画板 | 尺寸 | 用途 |
| --- | ---: | --- |
| 询价白版设置 | 2285 x 733 | 白底设置弹窗、联系人配置、报价发送局部 |
| 询价助手1 | 1920 x 1080 | 深色询价助手主面板 |
| 询价助手2 | 1920 x 1080 | 深色询价助手扩展状态 |

实现时按 `1920 x 1080` 工作台环境优先适配；白版设置弹窗可作为独立浮层组件复用。

## 3. 颜色规范

颜色以 `theme/tokens.json` 为准，语义分组如下。

| 用途 | Token | 色值 |
| --- | --- | --- |
| 主按钮 / 开关开启 | `brand.primary` | `#0060DB` |
| 主按钮按下 | `brand.primaryPressed` | `#0055C7` |
| 主按钮悬浮 | `brand.primaryHover` | `#1B7EFF` |
| 分区强调线 / Tab 指示 | `brand.primaryDeep` | `#025CAB` |
| 重要高亮 / 辅助强调 | `brand.cyan` | `#00D2DC` |
| 正向 / 成功 | `status.success` | `#00E056` |
| 警告 / 买卖方向辅助 | `status.warning` | `#FFA028` |
| 危险 / 红色方向 | `status.danger` | `#FF3446` |
| 白版正文 | `text.primary` | `#333333` |
| 白版标题 | `text.heading` | `#111111` |
| 白版次级文字 | `text.secondary` | `#666666` |
| 深色面板正文 | `text.inverseSecondary` | `rgba(255,255,255,0.87)` |
| 白版面板底色 | `surface.panel` | `#F2F3F5` |
| 选中浅蓝底 | `surface.selected` | `#E9F1FE` |
| 选中强蓝底 | `surface.selectedStrong` | `#CDEAFF` |
| 默认边框 | `border.default` | `#E3E5E8` |
| 分割线 | `border.divider` | `#DDDEE4` |

颜色使用规则：

- 主操作按钮、开关开启、确认类动作统一用 `#0060DB`。
- Tab 激活下划线、分区标题左侧竖线统一用 `#025CAB`。
- 白底弹窗正文默认 `#333333`，标题 `#111111`，弱提示使用 `rgba(0,0,0,0.30)` 或 `#919294`。
- 深色工作台正文使用 `rgba(255,255,255,0.87)`，弱文字使用 `#B1B1B1` 或 `#919294`。
- 危险或报买红色状态使用 `#FF3446`，不要混用多个红色。

## 4. 字体规范

基础字体：

```css
font-family: "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
```

字号层级：

| 层级 | 字号 | 行高 | 字重 | 场景 |
| --- | ---: | ---: | ---: | --- |
| 标题 | 14px | 14px | 500 | 弹窗标题、抽屉标题 |
| 一级 Tab | 16px | 16px | 400 / 500 | 顶部页签 |
| 正文 | 14px | 20px | 400 | 表单说明、字段内容 |
| 紧凑正文 | 14px | 14px | 400 | 表格、按钮、列表项 |
| 辅助文字 | 12px | 12px | 400 | 标签、徽标、提示 |
| 列表多行 | 13px | 22px | 400 | 联系人/经纪商列表 |

排版规则：

- 字间距默认 `0`；导出稿里个别 `-0.05px` 不建议在实现中保留。
- 按钮文字使用 14px，短按钮可保持 14px / 14px。
- 中文字段和值同列排列时，字段名保持 14px，弱值用 `text.disabled`。

## 5. 间距与布局

基础间距 token：

| Token | 值 | 用途 |
| --- | ---: | --- |
| `space.xs` | 4px | 图标与文字间距 |
| `space.sm` | 8px | 表单内部间距 |
| `space.md` | 12px | 小分组间距 |
| `space.lg` | 16px | 弹窗左右内边距、区域间距 |
| `space.xl` | 20px | 标题区、较大段落间距 |
| `space.xxl` | 24px | 大模块间距 |

白版设置弹窗参考尺寸：

- 弹窗主体：`642 x 634`
- 顶部标题栏高度：`30px`
- 内容左右边距：`16px`
- 顶部 Tab 起始 y：`95px`
- Tab 分割线高度：`1px`
- Tab 激活线高度：`2px`
- 设置项行高：建议 `32px`

布局规则：

- 弹窗内容采用左对齐，字段和列表使用 8px 网格对齐。
- 分区标题左侧竖线为 `2 x 12px`，标题文字距离竖线 `4-6px`。
- 列表容器和表格容器使用紧凑行距，避免大面积卡片化。
- 同一弹窗内按钮、输入框、选择器高度应保持一致，不混用多套高度。

## 6. 组件规范

### 6.1 弹窗

白版弹窗使用白底、浅灰标题栏和轻阴影。

- 背景：`surface.page`
- 标题栏：`surface.panel`
- 阴影：`0 13px 24px 2px rgba(19,20,26,0.05)`
- 标题文字：14px / 14px，`text.heading`，中等字重
- 关闭图标：16 x 16px，颜色 `text.primary`

弹窗不使用大圆角，当前导出稿为直角。若前端统一圆角，可控制在 `2-4px`。

### 6.2 Tab

用于设置弹窗顶部导航，如“用户偏好 / 发送对象 / 经济商排序 / 关注管理 / 数据权限 / 热键设置”。

- 激活文字：`text.heading`，16px / 16px，500
- 非激活文字：`text.secondary`，16px / 16px，400
- 底部分割线：`border.divider`，1px
- 激活指示线：`brand.primaryDeep`，2px，高度圆角 1px
- Tab 文案之间保持 20px 左右间隔，避免拥挤。

### 6.3 按钮

主按钮：

- 背景：`brand.primary`
- 悬浮：`brand.primaryHover`
- 按下：`brand.primaryPressed`
- 文字：`text.inverse`
- 字号：14px

次按钮：

- 背景：白色或透明
- 文字：`text.primary`
- 边框：`border.default`

危险按钮：

- 背景：`status.dangerDeep` 或 `status.danger`
- 文字：白色

按钮文案保持短词，不在按钮内换行。中文两个字按钮可保留中间空格，如“确 定”“取 消”，但真实实现中建议统一为不加空格。

### 6.4 开关

参考“对外报价权限”开关：

- 尺寸：`29 x 14px`
- 轨道开启：`brand.primary`
- 滑块：白色，`12 x 12px`
- 轨道圆角：`10px` 或 pill
- 关闭态轨道：建议使用 `#B3B6B9`

### 6.5 输入框与搜索

搜索框和输入框应保持浅色边框、弱提示文字。

- 边框：`border.default`
- 背景：`surface.page`
- Placeholder：`text.disabled`
- 正文：`text.primary`
- 字号：14px

搜索图标使用 12-14px，和 placeholder 保持垂直居中。

### 6.6 列表与表格

联系人、经纪商、对手方列表属于高密度信息区。

- 表头文字：`#262626`，14px / 14px
- 正文：`text.primary`，13px / 22px 或 14px / 20px
- 选中行背景：`surface.selected` 或 `surface.selectedStrong`
- 行 hover：可使用 `surface.subtle`
- 分割线：`border.default`

列表中的标签徽标可使用 12px / 12px，深底白字或浅底深字，但同一列表内保持一致。

### 6.7 分区标题

如“发送对象组（上限10个分组）”“组内联系人（上限100人）”：

- 左侧强调线：`2 x 12px`，`brand.primaryDeep`
- 标题文字：14px / 14px，`text.primary`
- 标题和内容区间距：8px

### 6.8 深色询价面板

深色面板用于交易筛选与报价信息，优先保证字段可读性。

- 主背景：`surface.dark`
- 深层背景：`surface.darkDeep`
- 主文字：`text.inverseSecondary`
- 弱文字：`text.tertiary`
- 激活高亮：`brand.cyan` 或 `brand.primary`

深色面板中不要直接使用白版的 `#333333` 文字 token。

## 7. 状态规范

| 状态 | 规则 |
| --- | --- |
| 默认 | 使用正文色和默认边框，不额外强调 |
| Hover | 按钮变为 hover 色，列表使用浅底色 |
| Active / Selected | 使用蓝色指示线或浅蓝背景 |
| Disabled | 文字降低到 30%-45% 透明度，禁止只降低边框 |
| Error / Danger | 使用红色语义色，搭配明确错误信息 |
| Success | 使用绿色语义色，避免和主按钮蓝混用 |

状态必须同时体现在颜色、边框或背景至少一个维度上。关键状态不要只通过颜色区分，必要时配合图标或文字。

## 8. 交互规范

- 弹窗打开后焦点落在首个可操作控件或当前任务相关控件。
- `Enter` 可触发主操作时，需要避免和多行输入冲突。
- 关闭、取消、遮罩点击的行为要一致；涉及未保存设置时必须二次确认。
- 多选下拉应显示已选数量，超过可视范围时滚动，不撑高弹窗。
- 联系人搜索支持姓名、机构、号码三类关键词。
- 保存、重置等顶部操作按钮应固定在当前面板可见区域。

## 9. 落地规则

前端实现时优先引用 CSS 变量：

```css
.quote-modal {
  width: var(--tk-modal-width);
  background: var(--tk-color-surface-page);
  box-shadow: var(--tk-shadow-popup);
}

.quote-modal__tab.is-active {
  color: var(--tk-color-text-heading);
  border-bottom: 2px solid var(--tk-color-brand-primary-deep);
}

.quote-modal__switch.is-on {
  background: var(--tk-color-brand-primary);
}
```

不要在组件里重复写裸色值。确实需要新增颜色时，先补充到 `theme/tokens.json`，再同步到 `theme/theme.css`。

## 10. 交付检查清单

- 字体是否统一使用 `PingFang SC` 字体栈。
- 主按钮、开关、Tab 指示线是否使用统一蓝色体系。
- 白版弹窗正文是否保持 `#333333`，标题是否保持 `#111111`。
- 深色面板是否使用反白文字 token，未混入白版深灰文字。
- 弹窗、表格、列表的间距是否基于 4px / 8px 网格。
- 选中、hover、禁用、危险状态是否有稳定样式。
- 是否避免在业务组件中直接硬编码颜色、阴影、字号。
