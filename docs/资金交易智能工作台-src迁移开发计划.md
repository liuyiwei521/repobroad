# 资金交易智能工作台 src 迁移开发计划

## 背景

本次工作的目标是将 `newworkspace/trading-workbench-vue` 中已经完成的 Vue 原型实现，正式落入根工程的 `src` 目录，并让根工程直接以该实现作为运行入口。

根工程原本是 React + TSX 结构，而候选实现是独立的 Vue 3 + TypeScript + Vite 工程，因此这次不是简单复制文件，而是一次跨框架接管。

## 本次已完成内容

### 1. 根工程入口切换为 Vue

- 将根工程入口从 `src/main.tsx` 切换为 `src/main.ts`
- 将页面挂载点从 `#root` 切换为 `#app`
- 将 Vite 插件从 React 入口调整为 Vue 入口

涉及文件：

- `index.html`
- `vite.config.ts`
- `package.json`
- `package-lock.json`

### 2. Vue 业务代码同步到根 src

已将 `newworkspace/trading-workbench-vue/src` 中的核心实现同步到根目录 `src`，包括：

- `src/App.vue`
- `src/main.ts`
- `src/vite-env.d.ts`
- `src/components/*`
- `src/composables/*`
- `src/data/*`
- `src/styles/app.css`
- `src/styles/tdx-theme.css`
- `src/styles/tk-theme.css`

### 3. 构建验证通过

已完成根工程构建验证：

- `npm install --legacy-peer-deps`
- `npm run build`

当前根工程已可使用 Vue 版本入口完成生产构建。

## 当前状态判断

### 已达成

- 根工程已经接管 Vue 原型入口
- 根目录 `src` 已具备独立运行所需的页面、样式、mock 数据和组合逻辑
- 构建链路完整，无阻塞性编译错误

### 仍需关注

- 仓库中仍保留旧 React 代码和依赖，当前未删除
- `newworkspace` 下仍有原始未提交改动，本次未纳入根工程提交范围
- 部分中文文案存在编码异常，后续需要统一清洗
- 目前仍以 mock 数据为主，尚未接入真实业务接口

## 后续开发计划

### 第一阶段：运行验收

目标：确认迁移后的根工程页面行为与 `newworkspace` 原型一致。

建议检查项：

- 顶部工具栏与状态区展示是否正常
- 任务总览矩阵、待分配池、研究卡片是否能正常联动
- 行情面板、报价弹窗、聊天弹窗是否能正常打开与关闭
- Barometer 面板、趋势页、对比页的图表切换是否正常
- 页面在常见分辨率下是否存在布局溢出

### 第二阶段：编码与文案清洗

目标：修正可读性问题，降低后续维护成本。

建议处理项：

- 统一相关源码文件为 UTF-8 编码
- 清理页面中乱码或异常中文文案
- 统一标题、按钮、提示语、字段命名
- 对关键复杂交互补充少量注释

### 第三阶段：工程收口

目标：让仓库结构回归单一主线，避免双框架长期并存。

建议处理项：

- 清理不再使用的 React 入口与演示文件
- 移除不再需要的 React / MUI / Radix 相关依赖
- 清理仅用于旧页面的样式和临时资源
- 整理 `src/styles` 主题层级，明确 `tk-theme` 与 `tdx-theme` 的职责

### 第四阶段：真实数据接入

目标：从原型演示过渡到业务化可联调版本。

建议处理项：

- 为 `src/data` 中的 mock 数据建立接口映射层
- 明确账户、报价、对手方、待分配池、聊天流的数据结构
- 抽离请求层和状态管理边界
- 逐步替换本地 mock 为真实接口返回

### 第五阶段：质量保障

目标：避免后续迭代中出现迁移回退或交互失真。

建议处理项：

- 为关键页面建立基本渲染测试
- 为矩阵分配、聊天弹窗、行情筛选补交互测试
- 对核心场景补充截图基线或人工验收清单
- 在提交前固定执行构建验证

## 提交范围说明

本次建议提交范围仅包含：

- 根工程 Vue 接管相关修改
- 新增的 `src` 下 Vue 文件
- 本文档

本次不建议混入以下内容：

- `newworkspace` 下原本未处理的改动
- 临时日志文件
- `.worktrees` 等本地工作目录产物

## 建议提交信息

`feat: migrate trading workbench vue prototype into root src`
