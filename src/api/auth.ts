import { request } from "@/utils/request";
import type { LoginRequest, LoginResponse, UserInfo, MenuTree } from "@/types";

/** 用户登录 */
export function login(data: LoginRequest) {
  return request.post<LoginResponse>("/rbac/auth/login", data);
}

/** 刷新令牌 */
export function refreshToken(refreshTokenStr: string) {
  return request.post<LoginResponse>("/rbac/auth/refresh", {
    refreshToken: refreshTokenStr,
  });
}

/** 用户登出 */
export function logout() {
  return request.post("/rbac/auth/logout");
}

/** 获取用户信息 */
export function getUserInfo() {
  return request.get<UserInfo>("/rbac/auth/info");
}

/** 获取用户权限菜单树 (后端返回 List<MenuTreeVO>) */
export function getPermissions(): Promise<MenuTree[]> {
  return request.get<MenuTree[]>("/rbac/auth/permissions");
}

/** 发送忘记密码验证码 */
export function sendForgotPasswordCode(data: {
  type: "email" | "phone";
  account: string;
}) {
  return request.post("/rbac/forgot-password/send-code", data);
}

/** 验证验证码 */
export function verifyForgotPasswordCode(email: string, code: string) {
  return request.post("/rbac/forgot-password/verify-code", null, {
    params: { email, code },
  });
}

/** 重置密码 */
export function resetPassword(data: {
  email: string;
  code: string;
  newPassword: string;
  confirmNewPassword: string;
}) {
  return request.post("/rbac/forgot-password/reset-password", data);
}
