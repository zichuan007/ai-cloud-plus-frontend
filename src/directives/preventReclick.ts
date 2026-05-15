import type { App, Directive, DirectiveBinding } from "vue";
import { ElMessage } from "element-plus";

/**
 * 防重复点击指令 v-prevent-reclick
 * 用法: <el-button v-prevent-reclick @click="handleSubmit">提交</el-button>
 * 可选参数：延迟时间（毫秒），默认 1000ms
 * 用法带参数: <el-button v-prevent-reclick:2000 @click="handleSubmit">提交</el-button>
 */
export const preventReclick: Directive<HTMLElement, number> = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    const delay = binding.arg ? parseInt(binding.arg as string, 10) : 1000;

    el.addEventListener("click", (e: Event) => {
      if (el.dataset.preventClick === "true") {
        e.stopImmediatePropagation();
        e.preventDefault();
        ElMessage.warning("请勿重复点击");
        return;
      }

      el.dataset.preventClick = "true";

      setTimeout(() => {
        el.dataset.preventClick = "false";
      }, delay);
    });
  },
};

/** 注册防重复点击指令 */
export function setupPreventReclickDirective(app: App) {
  app.directive("prevent-reclick", preventReclick);
}
