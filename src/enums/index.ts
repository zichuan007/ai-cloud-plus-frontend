/**
 * 全局枚举定义
 * 用于消除魔法值 (Magic Numbers)，提高代码可读性和可维护性
 */

// ==================== 用户模块 ====================

/** 用户状态 */
export enum UserStatus {
  DISABLED = 0,
  ENABLED = 1,
}

/** 用户状态标签映射 */
export const UserStatusMap: Record<number, { label: string; type: 'success' | 'danger' }> = {
  [UserStatus.ENABLED]: { label: '启用', type: 'success' },
  [UserStatus.DISABLED]: { label: '禁用', type: 'danger' },
};

// ==================== 角色模块 ====================

/** 角色状态 */
export enum RoleStatus {
  DISABLED = 0,
  ENABLED = 1,
}

/** 数据权限范围 */
export enum DataScope {
  ALL = 1, // 全部数据
  DEPT = 2, // 本部门数据
  DEPT_AND_CHILD = 3, // 本部门及以下
  SELF = 4, // 仅本人数据
  CUSTOM = 5, // 自定义
}

/** 数据权限范围映射 */
export const DataScopeMap: Record<number, string> = {
  [DataScope.ALL]: '全部数据',
  [DataScope.DEPT]: '本部门数据',
  [DataScope.DEPT_AND_CHILD]: '本部门及以下',
  [DataScope.SELF]: '仅本人数据',
  [DataScope.CUSTOM]: '自定义',
};

// ==================== 菜单模块 ====================

/** 菜单类型（与 DB sys_menu.type 对齐：1=目录, 2=菜单, 3=按钮） */
export enum MenuType {
  DIRECTORY = 1,
  MENU = 2,
  BUTTON = 3,
}

/** 菜单类型标签映射 */
export const MenuTypeMap: Record<number, string> = {
  [MenuType.DIRECTORY]: '目录',
  [MenuType.MENU]: '菜单',
  [MenuType.BUTTON]: '按钮',
};

// ==================== 部门模块 ====================

/** 部门状态 */
export enum DeptStatus {
  DISABLED = 0,
  ENABLED = 1,
}

// ==================== 通用模块 ====================

/** 通用状态 (0/1) */
export enum CommonStatus {
  DISABLED = 0,
  ENABLED = 1,
}

/** 性别 */
export enum Gender {
  UNKNOWN = 0,
  MALE = 1,
  FEMALE = 2,
}
