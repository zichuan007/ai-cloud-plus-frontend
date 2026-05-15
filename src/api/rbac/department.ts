import { request } from "@/utils/request";
import type { DepartmentTree, DeptQueryParams } from "@/types";

/** 获取当前用户部门树 */
export function getDepartmentTree(params?: DeptQueryParams) {
  return request.get<DepartmentTree[]>("/rbac/depts/tree", { params });
}

/** 创建部门 */
export function createDepartment(data: DepartmentTree) {
  return request.post("/rbac/depts", data);
}

/** 更新部门 */
export function updateDepartment(id: number, data: DepartmentTree) {
  return request.put(`/rbac/depts/${id}`, data);
}

/** 删除部门 (支持单个/批量) */
export function deleteDepartment(id: number | number[]) {
  const ids = Array.isArray(id) ? id : [id];
  return request.post("/rbac/depts/batch-delete", ids);
}
