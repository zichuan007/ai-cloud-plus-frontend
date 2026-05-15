import type { App, Directive } from "vue";
import { useUserStore } from "@/stores/user";

/** 权限指令 v-permission */
const permission: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const { value } = binding;
    const userStore = useUserStore();

    // 超级管理员拥有所有权限
    if (userStore.userInfo?.isAdmin) {
      return;
    }

    if (value) {
      const permissions = userStore.permissions || [];
      const roles = userStore.roles || [];

      // 支持字符串或数组
      const checkValues = Array.isArray(value) ? value : [value];

      const hasPermission = checkValues.some((perm) => {
        // 支持角色判断 (以 role: 开头)
        if (perm.startsWith("role:")) {
          return roles.includes(perm.replace("role:", ""));
        }
        return permissions.includes(perm);
      });

      if (!hasPermission) {
        el.parentNode?.removeChild(el);
      }
    } else {
      throw new Error(
        "v-permission 需要传入权限标识，如 v-permission=\"'user:add'\" 或 v-permission=\"['user:add']\"",
      );
    }
  },
};

/** 注册权限指令 */
export function setupPermissionDirective(app: App) {
  app.directive("permission", permission);
}
