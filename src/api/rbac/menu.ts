import { request } from "@/utils/request";
import type { MenuTree, MenuQueryParams } from "@/types";

/** 获取菜单树 */
export function getMenuTree(params?: MenuQueryParams) {
  return request.get<MenuTree[]>("/rbac/menus/tree", { params });
}

/** 获取当前用户菜单 */
export function getUserMenus() {
  return request.get<MenuTree[]>("/rbac/menus/user-menus");
}

/** 创建菜单 (支持单个/批量) */
export function createMenu(data: MenuTree | MenuTree[]) {
  const menus = Array.isArray(data) ? data : [data];
  return request.post("/rbac/menus/batch", menus);
}

/** 更新菜单 */
export function updateMenu(id: number, data: MenuTree) {
  return request.put(`/rbac/menus/${id}`, data);
}

/** 删除菜单 (支持单个/批量) */
export function deleteMenu(id: number | number[]) {
  const ids = Array.isArray(id) ? id : [id];
  return request.post("/rbac/menus/batch-delete", ids);
}
