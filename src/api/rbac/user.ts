import { request } from "@/utils/request";
import type { PageResult, UserVO, UserCreateDTO, UserUpdateDTO, UserQueryParams } from "@/types";

/** 获取用户列表 */
export function getUserList(params: UserQueryParams) {
  const backendParams = {
    page: params.current || 1,
    pageSize: params.size || 10,
    username: params.username,
    status: params.status,
    departmentId: params.departmentId,
  };
  return request.get<PageResult<UserVO>>("/rbac/users/page", {
    params: backendParams,
  });
}

/** 获取用户详情 */
export function getUserDetail(id: number) {
  return request.get<UserVO>(`/rbac/users/${id}`);
}

/** 创建用户 (支持单个/批量) */
export function createUser(data: UserCreateDTO | UserCreateDTO[]) {
  const users = Array.isArray(data) ? data : [data];
  return request.post("/rbac/users/batch", users);
}

/** 更新用户 */
export function updateUser(id: number, data: UserUpdateDTO) {
  return request.put(`/rbac/users/${id}`, data);
}

/** 删除用户 (支持单个/批量) */
export function deleteUser(id: number | number[]) {
  const ids = Array.isArray(id) ? id : [id];
  return request.post("/rbac/users/batch-delete", ids);
}

/** 重置用户密码 */
export function resetUserPassword(id: number, newPassword: string) {
  return request.put(`/rbac/users/${id}/password`, { password: newPassword } as any);
}

/** 分配角色 */
export function assignUserRoles(id: number, roleIds: number[]) {
  return request.put(`/rbac/users/${id}/roles`, { roleIds } as any);
}
