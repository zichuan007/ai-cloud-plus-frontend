<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item label="用户名">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="queryParams.phone"
            placeholder="请输入手机号"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择"
            clearable
          >
            <el-option
              v-for="(item, key) in UserStatusMap"
              :key="key"
              :label="item.label"
              :value="Number(key)"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 操作栏 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <div>
            <el-button
              type="primary"
              v-permission="['sys:user:add']"
              @click="handleAdd"
            >
              <el-icon><Plus /></el-icon>
              新增用户
            </el-button>
            <el-button
              type="danger"
              :disabled="selectedIds.length === 0"
              v-permission="['sys:user:delete']"
              @click="handleBatchDelete"
            >
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </div>
        </div>
      </template>

      <!-- 表格 -->
      <el-table
        :data="enrichedTableData"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="50" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="姓名" min-width="100" />
        <el-table-column prop="departmentName" label="部门" min-width="140">
          <template #default="{ row }">
            {{ row.departmentName || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="角色" min-width="180">
          <template #default="{ row }">
            <div v-if="row.roleNames?.length" class="role-cell">
              <el-tag
                v-for="role in row.roleNames"
                :key="role"
                size="small"
                class="role-tag"
              >
                {{ role }}
              </el-tag>
            </div>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="UserStatusMap[row.status]?.type || 'info'">
              {{ UserStatusMap[row.status]?.label || "未知" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button
                text
                type="primary"
                v-permission="['sys:user:edit']"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                text
                type="warning"
                v-permission="['sys:user:resetPwd']"
                @click="handleResetPwd(row)"
              >
                重置密码
              </el-button>
              <el-button
                text
                type="danger"
                v-permission="['sys:user:delete']"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.current"
          v-model:page-size="queryParams.size"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleQuery"
          @current-change="handleQuery"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      align-center
      append-to-body
      destroy-on-close
      @closed="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="formData.username"
                :disabled="isEdit"
                placeholder="请输入用户名"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="!isEdit">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="formData.password"
                type="password"
                show-password
                placeholder="请输入密码"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="姓名" prop="nickname">
              <el-input v-model="formData.nickname" placeholder="请输入姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门" prop="departmentId">
              <el-tree-select
                v-model="formData.departmentId"
                :data="departmentTree"
                :props="({ label: 'name', value: 'id' } as any)"
                placeholder="请选择部门"
                check-strictly
                default-expand-all
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="角色" prop="roleIds">
              <el-select
                v-model="formData.roleIds"
                multiple
                placeholder="请选择角色"
              >
                <el-option
                  v-for="role in roleList"
                  :key="role.id"
                  :label="role.roleName"
                  :value="role.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="UserStatus.ENABLED">正常</el-radio>
                <el-radio :value="UserStatus.DISABLED">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input
                v-model="formData.remark"
                type="textarea"
                :rows="2"
                placeholder="请输入备注"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="submitLoading"
            @click="handleSubmit"
            >确定</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, defineOptions } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { Search, Refresh, Plus, Delete } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
} from "@/api/rbac/user";
import { getDepartmentTree } from "@/api/rbac/department";
import { getRoleList } from "@/api/rbac/role";
import { useTable } from "@/hooks/useTable";
import { UserStatus, UserStatusMap } from "@/enums";
import { requiredRule, phoneRule, emailRule } from "@/utils/rules";
import type { UserVO, UserCreateDTO, DepartmentTree, RoleVO } from "@/types";

// 定义组件名称，用于 Keep-Alive 缓存
defineOptions({ name: "RbacUsers" });

// 使用通用 Table Hook
const { tableData, loading, total, queryParams, handleQuery, handleReset } =
  useTable<UserVO>(getUserList, { username: "", phone: "", status: undefined });

const submitLoading = ref(false);
const selectedIds = ref<number[]>([]);
const dialogVisible = ref(false);
const isEdit = ref(false);
const departmentTree = ref<DepartmentTree[]>([]);
const roleList = ref<RoleVO[]>([]);

// 🔴 核心修复：后端 UserDto 没有 departmentName 和 roleNames，需要前端转换
// 创建 ID 到名称的映射表
const deptNameMap = computed(() => {
  const map = new Map<number, string>();
  function traverse(depts: DepartmentTree[]) {
    for (const dept of depts) {
      map.set(dept.id, dept.name);
      if (dept.children?.length) traverse(dept.children);
    }
  }
  traverse(departmentTree.value);
  return map;
});

const roleNameMap = computed(() => {
  const map = new Map<number, string>();
  for (const role of roleList.value) {
    map.set(role.id, role.roleName);
  }
  return map;
});

// 转换后的表格数据（添加 departmentName 和 roleNames）
const enrichedTableData = computed(() => {
  return tableData.value.map((row) => {
    const u = row as any;
    // 转换部门名称
    const deptName = u.departmentId
      ? deptNameMap.value.get(u.departmentId)
      : undefined;
    // 转换角色名称列表 (roleIds 是逗号分隔字符串，如 "1,2,3")
    const roleNames: string[] = [];
    if (u.roleIds) {
      const ids = u.roleIds
        .split(",")
        .map((id: string) => parseInt(id.trim(), 10))
        .filter(Boolean);
      for (const id of ids) {
        const name = roleNameMap.value.get(id);
        if (name) roleNames.push(name);
      }
    }
    return {
      ...row,
      departmentName: deptName || "-",
      roleNames,
    };
  });
});

const formData = reactive<UserCreateDTO & { id?: number }>({
  username: "",
  nickname: "",
  password: "",
  email: "",
  phone: "",
  departmentId: 0,
  roleIds: [],
  status: UserStatus.ENABLED,
  remark: "",
});

const formRef = ref<FormInstance>();

// 使用共享校验规则
const formRules: FormRules = {
  username: requiredRule("请输入用户名"),
  password: requiredRule("请输入密码"),
  nickname: requiredRule("请输入姓名"),
  phone: phoneRule,
  email: emailRule,
  departmentId: requiredRule("请选择部门"),
  roleIds: requiredRule("请选择角色"),
};

const dialogTitle = computed(() => (isEdit.value ? "编辑用户" : "新增用户"));

onMounted(() => {
  handleQuery(); // 初始化加载数据
  fetchRoles();
  fetchDepartments();
});

async function fetchRoles() {
  try {
    const res = await getRoleList({ current: 1, size: 1000 });
    roleList.value = Array.isArray(res) ? res : (res as any).records || [];
  } catch {
    // ignore
  }
}

async function fetchDepartments() {
  try {
    departmentTree.value = await getDepartmentTree();
  } catch {
    // ignore
  }
}

function handleSelectionChange(rows: UserVO[]) {
  selectedIds.value = rows.map((r) => r.id);
}

function handleAdd() {
  isEdit.value = false;
  dialogVisible.value = true;
}

function handleEdit(row: UserVO) {
  isEdit.value = true;
  Object.assign(formData, {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    email: row.email,
    phone: row.phone,
    departmentId: row.departmentId,
    status: row.status,
    remark: row.remark || "",
  });
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return;

    submitLoading.value = true;
    try {
      if (isEdit.value && formData.id) {
        await updateUser(formData.id, formData as any);
        ElMessage.success("更新成功");
      } else {
        await createUser(formData);
        ElMessage.success("创建成功");
      }
      dialogVisible.value = false;
      handleQuery(); // 刷新列表
    } catch {
      // ignore
    } finally {
      submitLoading.value = false;
    }
  });
}

async function handleDelete(row: UserVO) {
  await ElMessageBox.confirm(`确定删除用户 "${row.username}" 吗?`, "提示", {
    type: "warning",
  });
  try {
    await deleteUser([row.id]);
    ElMessage.success("删除成功");
    handleQuery();
  } catch (error) {
    ElMessage.error("删除失败");
  }
}

async function handleBatchDelete() {
  await ElMessageBox.confirm(
    `确定删除选中的 ${selectedIds.value.length} 个用户吗?`,
    "提示",
    {
      type: "warning",
    },
  );
  try {
    await deleteUser(selectedIds.value);
    ElMessage.success("批量删除成功");
    handleQuery();
  } catch (error) {
    ElMessage.error("批量删除失败");
  }
}

async function handleResetPwd(row: UserVO) {
  const { value } = await ElMessageBox.prompt("请输入新密码", "重置密码", {
    inputType: "password",
    inputValidator: (v) => (v && v.length >= 6 ? true : "密码至少 6 位"),
  });
  try {
    await resetUserPassword(row.id, value);
    ElMessage.success("密码重置成功");
  } catch {
    // ignore
  }
}

function resetForm() {
  formData.id = undefined;
  formData.username = "";
  formData.nickname = "";
  formData.password = "";
  formData.email = "";
  formData.phone = "";
  formData.departmentId = 0;
  formData.roleIds = [];
  formData.status = UserStatus.ENABLED;
  formData.remark = "";
  formRef.value?.resetFields();
}
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.role-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.role-tag {
  margin: 0;
}

.text-muted {
  color: #909399;
  font-size: 13px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
