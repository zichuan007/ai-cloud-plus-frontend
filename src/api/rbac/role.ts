import { request } from "@/utils/request";
import type { PageResult, RoleVO, RoleCreateDTO, RoleQueryParams } from "@/types";

/** 获取角色列表 */
export function getRoleList(params: RoleQueryParams) {
  const backendParams = {
    page: params.current || 1,
    pageSize: params.size || 10,
    roleName: params.roleName,
    roleCode: params.roleCode,
    status: params.status,
  };
  return request.get<PageResult<RoleVO>>("/rbac/roles/page", {
    params: backendParams,
  });
}

/** 获取所有角色 */
export function getAllRoles() {
  return request.get<PageResult<RoleVO>>("/rbac/roles/page", {
    params: { page: 1, pageSize: 1000 },
  });
}

/** 获取角色详情 */
export function getRoleDetail(id: number) {
  return request.get<RoleVO>(`/rbac/roles/${id}`);
}

/** 创建角色 (支持单个/批量) */
export function createRole(data: RoleCreateDTO | RoleCreateDTO[]) {
  const roles = Array.isArray(data) ? data : [data];
  return request.post("/rbac/roles/batch", roles);
}

/** 更新角色 */
export function updateRole(id: number, data: RoleCreateDTO) {
  return request.put(`/rbac/roles/${id}`, data);
}

/** 删除角色 (支持单个/批量) */
export function deleteRole(id: number | number[]) {
  const ids = Array.isArray(id) ? id : [id];
  return request.post("/rbac/roles/batch-delete", ids);
}

/** 分配权限 */
export function assignRolePermissions(id: number, menuIds: number[]) {
  return request.put(`/rbac/roles/${id}/permissions`, { menuIds } as any);
}

/** 分配用户 */
export function assignRoleUsers(id: number, userIds: number[]) {
  return request.put(`/rbac/roles/${id}/users`, { userIds } as any);
}

/** 更新角色数据权限 */
export function updateRoleDataScope(data: { roleId: number; dataScope: number; deptIds?: number[] }) {
  return request.put("/rbac/roles/dataScope", data);
}
