/** 统一 API 响应结构 (后端 EnhancedResult 包装) */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
  page?: {
    total: number;
    size: number;
    current: number;
    pages: number;
  };
}

/** 分页结果 */
export interface PageResult<T> {
  records: T[];
  total: number;
  current: number;
  size: number;
  pages: number;
}

/** 分页查询参数 */
export interface PageQuery {
  current: number;
  size: number;
}

/** 用户信息 */
export interface UserInfo {
  id: number;
  username: string;
  userNo: string;
  nickname: string;
  avatar: string;
  email: string;
  phone: string;
  departmentId?: number;
  deptId?: number; // 兼容后端字段
  departmentName?: string;
  roles?: string[];
  roleIds?: string; // 兼容后端字段 (逗号分隔)
  permissions?: string[];
  isAdmin?: boolean; // 是否为超级管理员
}

/** 登录请求 */
export interface LoginRequest {
  username: string;
  password: string;
  captcha?: string;
  captchaKey?: string;
}

/** 登录响应 (后端 AuthResponseDto) */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

/** 菜单树 */
export interface MenuTree {
  id: number;
  name: string;
  type: number;
  path?: string;
  component?: string;
  permission?: string;
  icon?: string;
  sort: number;
  visible: number;
  children?: MenuTree[];
}

/** 权限响应 */
export interface PermissionResponse {
  menus: MenuTree[];
  permissions: string[];
  roles: string[];
}

/** 用户 VO (后端 UserDto) */
export interface UserVO {
  id: number;
  username: string;
  userNo: string;
  nickname: string;
  avatar: string;
  email: string;
  phone: string;
  departmentId: number;
  departmentName: string;
  roleNames: string[];
  status: number;
  remark?: string;
  createTime: string;
  updateTime: string;
}

/** 用户创建 DTO (后端 User) */
export interface UserCreateDTO {
  username: string;
  nickname: string;
  password: string;
  email?: string;
  phone?: string;
  departmentId: number;
  roleIds?: number[];
  status?: number;
  remark?: string;
}

/** 用户更新 DTO */
export interface UserUpdateDTO {
  nickname: string;
  email?: string;
  phone?: string;
  departmentId: number;
  roleIds?: number[];
  status: number;
  remark?: string;
}

/** 角色 VO (后端 Role) */
export interface RoleVO {
  id: number;
  roleName: string;
  roleCode: string;
  dataScope: number;
  customDeptIds: number[];
  deptIds?: number[]; // 用于接收后端返回的自定义部门列表
  sort: number;
  status: number;
  userCount: number;
  createTime: string;
}

/** 角色创建 DTO */
export interface RoleCreateDTO {
  roleName: string;
  roleCode: string;
  dataScope?: number;
  customDeptIds?: number[];
  deptIds?: number[]; // 用于提交自定义部门
  sort?: number;
  status?: number;
  remark?: string;
}

/** 部门树 (后端 Dept) */
export interface DepartmentTree {
  id: number;
  parentId: number;
  name: string;
  sort: number;
  leader?: string;
  phone?: string;
  email?: string;
  status: number;
  children?: DepartmentTree[];
}

/** 流程定义 VO */
export interface DefinitionVO {
  id: string;
  name: string;
  key: string;
  version: number;
  status: number;
  deploymentId: string;
  deploymentTime: string;
  category?: string;
  description?: string;
}

/** 流程实例 VO */
export interface InstanceVO {
  instanceId: string;
  processName: string;
  processKey: string;
  startUserId: number;
  startUserName: string;
  status: number;
  startTime: string;
  endTime?: string;
  duration?: number;
}

/** 待办任务 VO (后端 WfProcessApprovalRecords) */
export interface TodoTaskVO {
  taskId: string;
  taskName: string;
  processInstanceId: string;
  processName: string;
  startUserId: number;
  startUserName: string;
  createTime: string;
  priority: number;
  assignee: string;
}

/** 流程模型 VO */
export interface ModelVO {
  id: string;
  name: string;
  key: string;
  category?: string;
  version: number;
  status: number;
  createTime: string;
  updateTime?: string;
  description?: string;
  xml?: string;
}

/** 流程模型创建 DTO */
export interface ModelCreateDTO {
  name: string;
  key: string;
  category?: string;
  description?: string;
}

/** 流程模型更新 DTO */
export interface ModelUpdateDTO {
  name?: string;
  xml?: string;
  description?: string;
}

/** 节点策略配置 VO (V2.0 wf_node_config) */
export interface NodeConfigVO {
  id?: number;
  processDefKey: string;
  nodeDefKey: string;
  nodeName?: string;
  assignType: string; // USER/ROLE/DEPT/POST/API
  assignValue: string; // 分配值 (角色编码/部门ID/表达式)
  approveMode: string; // ANY(或签)/ALL(会签)/SEQUENTIAL(顺签)
  passThreshold?: number;
  rejectMode?: string; // INITIATOR/PREVIOUS/CUSTOM/BPMN
  rejectTargetNode?: string;
  timeoutHours?: number;
  timeoutStrategy?: string; // AUTO_APPROVE/AUTO_TRANSFER
  allowTransfer?: number;
  allowAddSign?: number;
  emptyHandler?: string; // TO_ADMIN/TO_INITIATOR/SKIP/REJECT
  enabled?: number;
  sortOrder?: number;
  tenantId?: number;
  createTime?: string;
  updateTime?: string;
}

/** 用户查询参数 */
export interface UserQueryParams extends PageQuery {
  username?: string;
  status?: number;
  departmentId?: number;
}

/** 角色查询参数 */
export interface RoleQueryParams extends PageQuery {
  roleName?: string;
  roleCode?: string;
  status?: number;
}

/** 菜单查询参数 */
export interface MenuQueryParams {
  name?: string;
  status?: number;
}

/** 部门查询参数 */
export interface DeptQueryParams {
  name?: string;
  status?: number;
}

/** 流程查询参数 */
export interface WorkflowQueryParams {
  current?: number;
  size?: number;
  name?: string;
  key?: string;
  status?: number;
  processName?: string;
  startUserId?: number;
  startTime?: string;
  endTime?: string;
  tenantId?: number;
  result?: string;
}

/** 任务审批 DTO */
export interface TaskApproveDTO {
  taskId: string;
  comment: string;
  variables?: Record<string, any>;
  tenantId?: number;
}

/** 任务驳回 DTO */
export interface TaskRejectDTO {
  taskId: string;
  comment: string;
  targetNodeId?: string;
  tenantId?: number;
}

/** 任务转办 DTO */
export interface TaskTransferDTO {
  taskId: string;
  targetUserId: number;
  comment: string;
  tenantId?: number;
}

/** 流程发起 DTO */
export interface ProcessStartDTO {
  processKey: string;
  businessKey?: string;
  variables?: Record<string, any>;
  form?: Record<string, any>;
  tenantId?: number;
}

// ==================== 动态流程启动配置类型 ====================

/** 动态表单字段定义 */
export interface FormField {
  type: "input" | "number" | "select" | "textarea" | "date" | "upload";
  field: string;
  title: string;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
  props?: Record<string, any>;
}

/** 审批节点映射配置 */
export interface ApprovalMappingItem {
  varName: string;
  label: string;
}

/** 流程启动配置 */
export interface FormConfig {
  id: number;
  processDefinitionKey: string;
  version: number;
  formSchema: FormField[];
  approvalMapping: Record<string, ApprovalMappingItem>;
  status: number;
}
