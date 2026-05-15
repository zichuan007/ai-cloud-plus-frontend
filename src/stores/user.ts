import { defineStore } from "pinia";
import { ref, computed } from "vue";
import Cookies from "js-cookie";
import type { UserInfo } from "@/types";
import { getUserInfo, logout as logoutApi, refreshToken as refreshTokenApi } from "@/api/auth";
import router from "@/router";

export const useUserStore = defineStore("user", () => {
  const token = ref(Cookies.get("access_token") || "");
  const userInfo = ref<UserInfo | null>(null);
  const permissions = ref<string[]>([]);
  const roles = ref<string[]>([]);

  const isLoggedIn = computed(() => !!token.value);
  const nickname = computed(() => userInfo.value?.nickname || "");
  const avatar = computed(() => userInfo.value?.avatar || "");

  async function login(accessToken: string, refreshToken: string) {
    token.value = accessToken;

    // 🔴 核心修复：js-cookie 已正确处理 path 属性，无需原生 API 重复写入
    Cookies.set("access_token", accessToken, { expires: 1, path: "/" });
    Cookies.set("refresh_token", refreshToken, { expires: 7, path: "/" });

    console.log("🍪 [UserStore] Token 写入完成");
  }

  /**
   * 🔴 新增：刷新 Access Token
   * 用于在 Access Token 过期时自动换取新 Token，实现无感刷新
   */
  async function refreshAccessToken() {
    const refreshToken = Cookies.get("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    try {
      console.log("🔄 [UserStore] 开始刷新 Token...");
      const res = await refreshTokenApi(refreshToken);
      
      // 后端返回结构通常包含 accessToken 和 refreshToken (轮转机制)
      const newAccessToken = (res as any).accessToken;
      const newRefreshToken = (res as any).refreshToken;

      if (!newAccessToken) {
        throw new Error("Invalid response from refresh API");
      }

      // 更新 Store 和 Cookies
      token.value = newAccessToken;
      Cookies.set("access_token", newAccessToken, { expires: 1, path: "/" });
      
      // 如果后端返回了新的 Refresh Token (轮转机制)，也要更新
      if (newRefreshToken) {
        Cookies.set("refresh_token", newRefreshToken, { expires: 7, path: "/" });
      }

      console.log("✅ [UserStore] Token 刷新成功");
      return newAccessToken;
    } catch (error) {
      console.error("❌ [UserStore] Token 刷新失败", error);
      throw error;
    }
  }

  async function fetchUserInfo() {
    const user = await getUserInfo();
    userInfo.value = user as UserInfo;

    // 🔴 核心修复：根据后端实际 User 实体结构提取数据
    // 后端 User 实体包含 roleIds (逗号分隔字符串)，没有 permissions/roles 数组
    const u = user as any;

    // 从 roleIds 字符串提取角色 ID 数组 (如 "1,2,3" -> ["1", "2", "3"])
    if (u.roleIds) {
      roles.value = u.roleIds
        .split(",")
        .map((id: string) => id.trim())
        .filter(Boolean);
    } else {
      roles.value = [];
    }

    // permissions 不在此处设置，由 permissionStore.generateRoutes() 从菜单树中提取
    console.log("👤 [UserStore] 用户信息加载完成:", {
      username: u.username,
      roleIds: u.roleIds,
      roles: roles.value,
    });
  }

  async function logout() {
    try {
      await logoutApi();
    } catch {
      // 忽略登出接口错误
    } finally {
      resetState();
      // 🔴 核心修复：登出后主动跳转到登录页，避免用户看到残留页面
      router.replace("/login");
    }
  }

  // 安全清理状态（不触发重复跳转，供路由守卫调用）
  function resetState() {
    token.value = "";
    userInfo.value = null;
    permissions.value = [];
    roles.value = [];
    // 🔴 修复：删除时也必须指定 path: "/"，确保彻底清除
    Cookies.remove("access_token", { path: "/" });
    Cookies.remove("refresh_token", { path: "/" });
    sessionStorage.removeItem("routesLoaded");
    // 注意：这里不直接 router.push，由调用方（如路由守卫）决定跳转逻辑
  }

  return {
    token,
    userInfo,
    permissions,
    roles,
    isLoggedIn,
    nickname,
    avatar,
    login,
    refreshAccessToken,
    fetchUserInfo,
    logout,
    resetState,
  };
});
