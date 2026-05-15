// ==================== 开发环境重置会话状态 ====================
// 🔴 核心修复：仅清空 sessionStorage（路由状态），保留 Cookie 以便测试登录态持久化
(function clearSessionStorage() {
  try {
    sessionStorage.clear();
    console.log("[Dev] sessionStorage 已清空 - 保留 Cookie 登录态");
  } catch (e) {
    console.error("[Dev] 清空 sessionStorage 失败:", e);
  }
})();

import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

import App from "./App.vue";
import router from "./router";
import "./assets/styles/theme.css";
import "./assets/styles/index.scss";
import { setupPermissionDirective } from "./directives/permission";
import { setupPreventReclickDirective } from "./directives/preventReclick";
import { SafeHtmlDirective } from "./utils/sanitize";

// 通用组件
import { Dialog, ConfirmButton, SearchForm } from "./components/Common";
import Pagination from "./components/Pagination/index.vue";

const app = createApp(App);

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 注册全局组件
app.component("Dialog", Dialog);
app.component("ConfirmButton", ConfirmButton);
app.component("SearchForm", SearchForm);
app.component("Pagination", Pagination);

app.use(createPinia());
app.use(router);
app.use(ElementPlus, { locale: zhCn });

// 注册权限指令
setupPermissionDirective(app);

// 注册防重复点击指令
setupPreventReclickDirective(app);

// 注册安全 HTML 指令
app.directive("safe-html", SafeHtmlDirective);

app.mount("#app");
