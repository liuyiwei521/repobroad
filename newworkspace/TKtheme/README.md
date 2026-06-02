# 主题配置

该目录把 `index.html` 里的 Sketch MeaXure 导出样式整理成可复用主题配置，供后续接入真实前端工程时使用。

## 文件

- `tokens.json`：设计 token 源数据，包含颜色、字体、圆角、间距、阴影和弹窗相关组件 token。
- `theme.css`：CSS 变量版本，可直接在静态页或前端项目中引入。

## 使用建议

在页面入口引入：

```html
<link rel="stylesheet" href="./theme/theme.css">
```

在组件样式里使用变量：

```css
.quote-modal {
  width: var(--tk-modal-width);
  background: var(--tk-color-surface-page);
  box-shadow: var(--tk-shadow-popup);
}

.quote-modal__title {
  color: var(--tk-color-text-heading);
  font-size: var(--tk-font-size-md);
  line-height: var(--tk-line-height-compact);
  font-weight: var(--tk-font-weight-medium);
}

.quote-modal__primary-button {
  background: var(--tk-color-brand-primary);
  color: var(--tk-color-text-inverse);
}
```

## 命名原则

- `brand`：业务主色及主按钮状态。
- `status`：成功、警告、危险等语义色。
- `text`：文字层级，不直接绑定具体组件。
- `surface`：页面、面板、选中态、深色背景。
- `border`：边框和分割线。
- `component`：只保留当前弹窗设计中稳定复用的组件级 token。
