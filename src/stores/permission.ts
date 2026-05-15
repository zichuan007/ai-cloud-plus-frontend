import { defineStore } from "pinia";
import { ref } from "vue";
import type { RouteRecordRaw } from "vue-router";
import type { MenuTree } from "@/types";
import { getPermissions } from "@/api/auth";
import { useUserStore } from "@/stores/user";

export const usePermissionStore = defineStore("permission", () => {
  const menus = ref<MenuTree[]>([]);
  const routes = ref<RouteRecordRaw[]>([]);
  const isLoaded = ref(false);

  async function generateRoutes() {
    try {
      console.log("[权限菜单] 开始请求接口...");
      const result = await getPermissions();
      console.log("[权限菜单] 接口返回:", result);

      // 后端 /rbac/auth/permissions 返回的是 List<MenuTreeVO>
      const menusList = Array.isArray(result) ? result : [];
      menus.value = menusList;
      routes.value = transformMenusToRoutes(menus.value);

      // 🔴 核心修复：从菜单树中提取所有权限标识 (permission 字段)
      // 后端没有单独的 permissions 数组，需要从菜单中收集
      const extractedPermissions: string[] = [];
      function collectPermissions(menuList: any[]) {
        for (const menu of menuList) {
          if (menu.permission) {
            extractedPermissions.push(menu.permission);
          }
          if (menu.children?.length) {
            collectPermissions(menu.children);
          }
        }
      }
      collectPermissions(menusList);

      // 🔴 核心修复：同步权限数据到 userStore
      const userStore = useUserStore();
      userStore.permissions = extractedPermissions;
      console.log("🔑 [PermissionStore] 从菜单提取权限:", extractedPermissions);

      isLoaded.value = true;
      console.log("[权限菜单] 路由生成完成，数量:", routes.value.length);
    } catch (e: any) {
      console.error("[权限菜单] 获取失败:", e);
      // 不设置 isLoaded = true，允许重试
      menus.value = [];
      routes.value = [];
      throw e; // 重新抛出，让 router/index.ts 的 catch 捕获到
    }
  }

  function reset() {
    menus.value = [];
    routes.value = [];
    isLoaded.value = false;
  }

  function getFirstMenuPath(): string {
    const path = routes.value[0]?.path;
    return path ? (path.startsWith("/") ? path : "/" + path) : "/";
  }

  return { menus, routes, isLoaded, generateRoutes, reset, getFirstMenuPath };
});

function transformMenusToRoutes(menus: MenuTree[]): RouteRecordRaw[] {
  const modules = import.meta.glob("/src/views/**/*.vue");
  const allRoutes: RouteRecordRaw[] = [];

  function processMenu(menu: MenuTree, parentPath: string = "") {
    if (menu.type === 3 || menu.visible === 0 || !menu.path) return;

    const currentPath = menu.path.startsWith("/")
      ? menu.path.slice(1)
      : menu.path;

    const fullPath = parentPath ? `${parentPath}/${currentPath}` : currentPath;

    if (menu.type === 1 || !menu.component) {
      if (menu.children?.length) {
        menu.children.forEach((child) => processMenu(child, fullPath));
      }
      return;
    }

    const routePath = fullPath;

    let component: any;
    const comp = menu.component;
    if (comp) {
      let targetPath = comp;
      if (targetPath.startsWith("/")) targetPath = targetPath.slice(1);
      targetPath = "/src/views/" + targetPath;
      if (!targetPath.endsWith(".vue")) targetPath += ".vue";

      const exactKey = Object.keys(modules).find((k) => k === targetPath);
      const indexKey = Object.keys(modules).find(
        (k) => k === targetPath.replace(".vue", "/index.vue"),
      );

      const key = exactKey || indexKey;

      if (key) {
        component = modules[key];
        console.log(`[组件匹配成功] ${comp} -> ${key}`);
      } else {
        console.warn(
          `[组件匹配失败] 找不到: ${comp} (尝试路径: ${targetPath})`,
        );
      }
    }

    const uniqueName = `Menu_${menu.id}`;

    allRoutes.push({
      path: routePath,
      name: uniqueName,
      meta: { title: menu.name, icon: menu.icon, menuId: menu.id },
      component,
    } as RouteRecordRaw);

    if (menu.children?.length) {
      menu.children.forEach((child) => processMenu(child, fullPath));
    }
  }

  menus.forEach((m) => processMenu(m, ""));
  return allRoutes;
}
