# AI Cloud Plus API 接口契约

> 版本: v1.0.0  
> 基准路径: `/api` (通过网关转发)  
> 认证方式: Bearer Token (JWT)

---

## 统一响应结构

```typescript
interface ApiResponse<T = any> {
  code: number          // 状态码: 200=成功, 401=未认证, 403=无权限, 500=服务器错误
  message: string       // 提示信息
  data: T              // 响应数据
  timestamp: number    // 时间戳
}

interface PageResult<T> {
  records: T[]         // 数据列表
  total: number        // 总记录数
  current: number      // 当前页码
  size: number         // 每页大小
  pages: number        // 总页数
}
```

---

## 1. 认证模块 `/auth`

### 1.1 用户登录

```
POST /auth/login
```

**请求体**:
```typescript
interface LoginRequest {
  username: string    // 用户名
  password: string    // 密码
  captcha?: string    // 验证码 (登录失败3次后必填)
  captchaKey?: string // 验证码Key
}
```

**响应**:
```typescript
interface LoginResponse {
  accessToken: string     // 访问令牌
  refreshToken: string    // 刷新令牌
  expiresIn: number       // 过期时间 (秒)
  user: UserInfo          // 用户信息
}
```

### 1.2 刷新令牌

```
POST /auth/refresh
```

**请求头**: `Authorization: Bearer <refreshToken>`

**响应**: 同登录响应

### 1.3 用户登出

```
POST /auth/logout
```

**请求头**: `Authorization: Bearer <token>`

### 1.4 获取用户信息

```
GET /auth/info
```

**响应**:
```typescript
interface UserInfo {
  id: number
  username: string
  userNo: string
  nickname: string
  avatar: string
  email: string
  phone: string
  departmentId: number
  departmentName: string
  roles: string[]         // 角色编码列表
  permissions: string[]   // 权限标识列表
}
```

### 1.5 获取用户权限

```
GET /auth/permissions
```

**响应**:
```typescript
interface PermissionResponse {
  menus: MenuTree[]       // 菜单树
  permissions: string[]   // 按钮权限标识列表
  roles: string[]         // 角色列表
}
```

### 1.6 发送忘记密码验证码

```
POST /auth/forgot-password/send-code
```

**请求体**:
```typescript
interface SendCodeRequest {
  type: 'email' | 'phone'  // 验证类型
  account: string          // 邮箱或手机号
}
```

### 1.7 重置密码

```
POST /auth/forgot-password/reset
```

**请求体**:
```typescript
interface ResetPasswordRequest {
  type: 'email' | 'phone'
  account: string
  code: string        // 验证码
  newPassword: string // 新密码
}
```

---

## 2. RBAC 权限管理 `/rbac`

### 2.1 用户管理 `/rbac/users`

#### 2.1.1 获取用户列表

```
GET /rbac/users
```

**查询参数**:
```typescript
interface UserQuery {
  current: number      // 页码
  size: number         // 每页大小
  username?: string    // 用户名 (模糊)
  phone?: string       // 手机号
  departmentId?: number // 部门ID
  status?: number      // 状态: 0=禁用, 1=正常
}
```

**响应**: `PageResult<UserVO>`

```typescript
interface UserVO {
  id: number
  username: string
  userNo: string
  nickname: string
  avatar: string
  email: string
  phone: string
  departmentId: number
  departmentName: string
  roleNames: string[]
  status: number
  createTime: string
  updateTime: string
}
```

#### 2.1.2 获取用户详情

```
GET /rbac/users/{id}
```

**响应**: `UserDetailVO`

```typescript
interface UserDetailVO extends UserVO {
  roleIds: number[]    // 角色ID列表
}
```

#### 2.1.3 创建用户

```
POST /rbac/users
```

**请求体**:
```typescript
interface UserCreateDTO {
  username: string
  nickname: string
  password: string
  email?: string
  phone?: string
  departmentId: number
  roleIds: number[]
  status?: number      // 默认 1
  remark?: string
}
```

#### 2.1.4 更新用户

```
PUT /rbac/users/{id}
```

**请求体**:
```typescript
interface UserUpdateDTO {
  nickname: string
  email?: string
  phone?: string
  departmentId: number
  roleIds: number[]
  status: number
  remark?: string
}
```

#### 2.1.5 删除用户

```
DELETE /rbac/users/{ids}   // ids 为逗号分隔的ID列表
```

#### 2.1.6 重置用户密码

```
PUT /rbac/users/{id}/password
```

**请求体**:
```typescript
interface ResetPasswordDTO {
  newPassword: string
}
```

#### 2.1.7 分配角色

```
PUT /rbac/users/{id}/roles
```

**请求体**:
```typescript
interface AssignRolesDTO {
  roleIds: number[]
}
```

---

### 2.2 角色管理 `/rbac/roles`

#### 2.2.1 获取角色列表

```
GET /rbac/roles
```

**查询参数**:
```typescript
interface RoleQuery {
  current: number
  size: number
  roleName?: string
  roleCode?: string
  status?: number
}
```

**响应**: `PageResult<RoleVO>`

```typescript
interface RoleVO {
  id: number
  roleName: string
  roleCode: string
  dataScope: number      // 数据权限: 1=全部, 2=本部门及下级, 3=本部门, 4=仅本人, 5=自定义
  customDeptIds: number[]
  sort: number
  status: number
  userCount: number      // 关联用户数
  createTime: string
}
```

#### 2.2.2 创建角色

```
POST /rbac/roles
```

**请求体**:
```typescript
interface RoleCreateDTO {
  roleName: string
  roleCode: string
  dataScope?: number     // 默认 3
  customDeptIds?: number[]
  sort?: number
  status?: number
  remark?: string
}
```

#### 2.2.3 更新角色

```
PUT /rbac/roles/{id}
```

#### 2.2.4 删除角色

```
DELETE /rbac/roles/{ids}
```

#### 2.2.5 分配权限

```
PUT /rbac/roles/{id}/permissions
```

**请求体**:
```typescript
interface AssignPermissionsDTO {
  menuIds: number[]
}
```

#### 2.2.6 分配用户

```
PUT /rbac/roles/{id}/users
```

**请求体**:
```typescript
interface AssignUsersDTO {
  userIds: number[]
}
```

---

### 2.3 菜单管理 `/rbac/menus`

#### 2.3.1 获取菜单树

```
GET /rbac/menus/tree
```

**响应**: `MenuTree[]`

```typescript
interface MenuTree {
  id: number
  parentId: number
  name: string
  type: number           // 1=目录, 2=菜单, 3=按钮
  icon?: string
  path?: string          // 路由路径
  component?: string     // 组件路径
  permission?: string    // 权限标识
  sort: number
  visible: number        // 0=隐藏, 1=显示
  keepAlive: number      // 0=不缓存, 1=缓存
  status: number
  children?: MenuTree[]
}
```

#### 2.3.2 创建菜单

```
POST /rbac/menus
```

**请求体**:
```typescript
interface MenuCreateDTO {
  parentId: number
  name: string
  type: number
  icon?: string
  path?: string
  component?: string
  permission?: string
  sort?: number
  visible?: number
  keepAlive?: number
  status?: number
  remark?: string
}
```

#### 2.3.3 更新菜单

```
PUT /rbac/menus/{id}
```

#### 2.3.4 删除菜单

```
DELETE /rbac/menus/{id}
```

---

### 2.4 部门管理 `/rbac/departments`

#### 2.4.1 获取当前用户部门树

```
GET /rbac/departments/tree
```

**说明**: 从登录上下文自动获取当前用户，返回用户所在部门及其子部门树

**响应**: `DepartmentTree[]`

```typescript
interface DepartmentTree {
  id: number
  parentId: number
  name: string
  sort: number
  leader?: string
  phone?: string
  email?: string
  status: number
  children?: DepartmentTree[]
}
```

#### 2.4.2 创建部门

```
POST /rbac/departments
```

**请求体**:
```typescript
interface DepartmentCreateDTO {
  parentId: number
  name: string
  sort?: number
  leader?: string
  phone?: string
  email?: string
  status?: number
}
```

#### 2.4.3 更新部门

```
PUT /rbac/departments/{id}
```

#### 2.4.4 删除部门

```
DELETE /rbac/departments/{id}
```

---

## 3. 工作流引擎 `/workflow`

### 3.1 流程定义 `/workflow/definitions`

#### 3.1.1 获取流程定义列表

```
GET /workflow/definitions
```

**查询参数**:
```typescript
interface DefinitionQuery {
  current: number
  size: number
  name?: string
  key?: string
  status?: number      // 1=激活, 2=挂起
}
```

**响应**: `PageResult<DefinitionVO>`

```typescript
interface DefinitionVO {
  id: string
  name: string
  key: string
  version: number
  status: number
  deploymentId: string
  deploymentTime: string
  category?: string
  description?: string
}
```

#### 3.1.2 部署流程

```
POST /workflow/definitions/deploy
```

**请求**: `multipart/form-data`
- `file`: BPMN 文件

#### 3.1.3 查看流程图

```
GET /workflow/definitions/{id}/diagram
```

**响应**: 图片流 (PNG)

#### 3.1.4 挂起/激活流程

```
PUT /workflow/definitions/{id}/status
```

**请求体**:
```typescript
interface UpdateDefinitionStatusDTO {
  status: number  // 1=激活, 2=挂起
}
```

#### 3.1.5 删除流程

```
DELETE /workflow/definitions/{id}
```

---

### 3.2 流程实例 `/workflow/instances`

#### 3.2.1 获取流程实例列表

```
GET /workflow/instances
```

**查询参数**:
```typescript
interface InstanceQuery {
  current: number
  size: number
  processName?: string
  instanceId?: string
  startUserId?: number
  status?: number      // 1=运行中, 2=已结束, 3=已终止
  startTime?: string
  endTime?: string
}
```

**响应**: `PageResult<InstanceVO>`

```typescript
interface InstanceVO {
  instanceId: string
  processName: string
  processKey: string
  startUserId: number
  startUserName: string
  status: number
  startTime: string
  endTime?: string
  duration?: number    // 耗时 (毫秒)
}
```

#### 3.2.2 获取实例详情

```
GET /workflow/instances/{instanceId}
```

#### 3.2.3 终止实例

```
PUT /workflow/instances/{instanceId}/terminate
```

**请求体**:
```typescript
interface TerminateInstanceDTO {
  reason: string
}
```

---

### 3.3 任务管理 `/workflow/tasks`

#### 3.3.1 获取待办任务

```
GET /workflow/tasks/todo
```

**查询参数**:
```typescript
interface TodoTaskQuery {
  current: number
  size: number
  taskName?: string
  processName?: string
  startUserName?: string
  startTime?: string
}
```

**响应**: `PageResult<TodoTaskVO>`

```typescript
interface TodoTaskVO {
  taskId: string
  taskName: string
  processInstanceId: string
  processName: string
  startUserId: number
  startUserName: string
  createTime: string
  priority: number
  assignee: string
}
```

#### 3.3.2 获取已办任务

```
GET /workflow/tasks/done
```

**查询参数**: 类似待办，增加 `result?: number` (1=同意, 2=驳回)

#### 3.3.3 获取我发起的

```
GET /workflow/tasks/initiated
```

#### 3.3.4 审批任务

```
POST /workflow/tasks/{taskId}/approve
```

**请求体**:
```typescript
interface ApproveTaskDTO {
  comment: string      // 审批意见
  variables?: Record<string, any>  // 流程变量
}
```

#### 3.3.5 驳回任务

```
POST /workflow/tasks/{taskId}/reject
```

**请求体**:
```typescript
interface RejectTaskDTO {
  comment: string
  targetNodeId?: string  // 驳回到指定节点 (可选)
  variables?: Record<string, any>
}
```

#### 3.3.6 转办任务

```
POST /workflow/tasks/{taskId}/transfer
```

**请求体**:
```typescript
interface TransferTaskDTO {
  targetUserId: number
  comment: string
}
```

#### 3.3.7 获取任务表单

```
GET /workflow/tasks/{taskId}/form
```

**响应**:
```typescript
interface TaskFormVO {
  formKey: string
  formFields: FormField[]
  businessData?: Record<string, any>
}
```

---

## 4. 错误码定义

| 错误码 | 说明 |
|-------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证/Token 过期 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 资源冲突 (如用户名已存在) |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 5. 请求头规范

```
Content-Type: application/json
Authorization: Bearer <accessToken>
X-Trace-Id: <traceId>          // 链路追踪ID (可选)
Accept-Language: zh-CN         // 语言
```
