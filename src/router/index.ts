import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { ElMessage } from "element-plus";
import Cookies from "js-cookie"; // 🔴 引入 Cookie 工具
import { useUserStore } from "@/stores/user";
import { usePermissionStore } from "@/stores/permission";
import { request } from "@/utils/request"; // 🔴 引入 request 实例以控制守卫标志

NProgress.configure({ showSpinner: false });

const constantRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/auth/login/index.vue"),
  },
  {
    path: "/forgot-password",
    name: "ForgotPassword",
    component: () => import("@/views/auth/forgot-password/index.vue"),
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("@/views/dashboard/index.vue"),
  },
  {
    path: "/",
    name: "BaseLayout",
    component: () => import("@/layouts/default/index.vue"),
    children: [],
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("@/views/error/404.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: constantRoutes,
});

const whiteList = ["/login", "/forgot-password"];

router.beforeEach(async (to) => {
  console.log("🛡️ [路由守卫] 进入检查 | 目标路径:", to.path);
  const userStore = useUserStore();
  const permissionStore = usePermissionStore();

  // 1. 🔴 优先检查 Cookie 中的 Token（Pinia 刷新会重置，但 Cookie 不会）
  const token = Cookies.get("access_token");
  console.log(
    "🔑 [路由守卫] 尝试读取 Cookie Token:",
    token ? `✅ 存在 (${token.slice(0, 10)}...)` : "❌ 不存在",
  );

  if (!token) {
    console.warn("🚫 [路由守卫] 无 Token，拦截跳转登录页");
    return whiteList.includes(to.path)
      ? true
      : `/login?redirect=${to.fullPath}`;
  }

  // 2. 已登录访问登录页，重定向到首页
  if (to.path === "/login") {
    console.log("🏠 [路由守卫] 已登录访问登录页，重定向到首页");
    return "/";
  }

  // 3. 动态路由加载
  if (!permissionStore.isLoaded) {
    console.log("📦 [路由守卫] 路由未加载，开始请求用户信息...");
    // 🔴 核心修复：激活守卫标志，防止守卫内 API 的 401 被响应拦截器重复处理
    request.setGuardActive(true);
    try {
      // 获取用户信息（恢复 Pinia 状态）
      await userStore.fetchUserInfo();
      console.log("👤 [路由守卫] 用户信息获取成功");

      // 🔴 关键验证：fetchUserInfo 成功后，再次确认 Cookie Token 仍然存在
      // 防止后端在 /rbac/auth/info 接口中使 Token 失效
      const tokenAfterCall = Cookies.get("access_token");
      if (!tokenAfterCall) {
        console.error(
          "🚨 [路由守卫] fetchUserInfo 后 Token 丢失！可能原因：后端接口使 Token 失效 / Cookie 被意外清除",
        );
        return `/login?redirect=${to.fullPath}`;
      }

      // 获取菜单并生成路由
      console.log("📦 [路由守卫] 开始生成菜单路由...");
      await permissionStore.generateRoutes();
      console.log(
        "🗺️ [路由守卫] 菜单路由生成成功，数量:",
        permissionStore.routes.length,
      );

      // 注册路由
      permissionStore.routes.forEach((route) => {
        router.addRoute("BaseLayout", route);
      });

      // 标记已加载（generateRoutes 内部已设置，此处为防御性编程）
      permissionStore.isLoaded = true;
      console.log("✅ [路由守卫] 路由注册完成，放行");

      // 🔴 核心修复：如果目标是 /dashboard 静态页，重定向到第一个菜单页
      // 避免用户停留在无侧边栏的静态页面
      if (to.path === "/dashboard" && permissionStore.routes.length > 0) {
        const firstMenuPath = permissionStore.getFirstMenuPath();
        const targetPath =
          firstMenuPath && firstMenuPath !== "/" ? firstMenuPath : "/dashboard";
        console.log(
          "🎯 [路由守卫] 检测到 /dashboard，重定向到第一个菜单:",
          targetPath,
        );
        return { path: targetPath, replace: true };
      }

      // 重新导航以匹配新注册的路由
      return { path: to.fullPath, replace: true };
    } catch (error: any) {
      console.error("❌ [路由守卫] 加载失败，完整错误对象:", error);

      // 只有明确是 401 才清除 Cookie 并跳登录
      const status = error?.response?.status;
      const msg = error?.message || "";
      console.warn("🚨 [路由守卫] 错误状态码:", status, "错误信息:", msg);

      if (
        status === 401 ||
        msg.includes("401") ||
        msg.includes("Unauthorized")
      ) {
        console.warn("🔴 [路由守卫] 接口明确返回 401，清除 Cookie 并跳登录");
        userStore.resetState(); // resetState() 内部已删除 Cookie，无需重复调用
        return `/login?redirect=${to.fullPath}`;
      }

      // 网络波动或服务器错误，保留 Token，提示重试，不踢人
      console.warn(
        "🟡 [路由守卫] 非 401 错误（网络/500），保留 Token 阻止跳转",
      );
      ElMessage.warning(`菜单加载失败: ${msg}，请检查网络或后端服务`);
      return false; // 关键：阻断跳转，让你留在当前页看报错
    } finally {
      // 🔴 核心修复：无论成功失败，都停用守卫标志
      request.setGuardActive(false);
    }
  }

  console.log("✅ [路由守卫] 路由已加载，直接放行");
  return true;
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
