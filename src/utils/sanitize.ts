import DOMPurify from "dompurify";

/**
 * 安全地渲染 HTML 内容
 * 使用 DOMPurify 过滤潜在的 XSS 攻击代码
 *
 * @param html 原始 HTML 字符串
 * @returns 清理后的安全 HTML 字符串
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // 配置允许的标签和属性
  const config = {
    ALLOWED_TAGS: [
      "a", "b", "blockquote", "br", "caption", "cite", "code", "col",
      "colgroup", "dd", "div", "dl", "dt", "em", "h1", "h2", "h3", "h4", "h5", "h6",
      "i", "img", "li", "ol", "p", "pre", "q", "small", "span", "strike", "strong",
      "sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul"
    ],
    ALLOWED_ATTR: [
      "href", "title", "alt", "src", "width", "height", "class", "id",
      "target", "rel", "style", "align", "valign", "colspan", "rowspan"
    ],
    // 禁止脚本执行
    SANITIZE_DOM: true,
    // 允许安全的样式
    ALLOWED_STYLES: [
      "color", "background-color", "font-size", "font-weight", "text-align",
      "margin", "padding", "border", "display", "width", "height"
    ]
  };

  return DOMPurify.sanitize(html, config);
}

/**
 * Vue 指令：安全渲染 HTML
 * 用法: <div v-safe-html="userContent"></div>
 */
import type { Directive, DirectiveBinding } from "vue";

export const SafeHtmlDirective: Directive<HTMLElement, string> = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    el.innerHTML = sanitizeHtml(binding.value);
  },
  updated(el: HTMLElement, binding: DirectiveBinding) {
    el.innerHTML = sanitizeHtml(binding.value);
  }
};
